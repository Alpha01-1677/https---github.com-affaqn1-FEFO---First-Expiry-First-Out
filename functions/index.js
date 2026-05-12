const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Triggered when a campaign document in 'live_campaigns' is written
exports.handlePromotionAcceptance = functions.firestore
    .document('live_campaigns/{campaignId}')
    .onWrite(async (change, context) => {
        const newValue = change.after.exists ? change.after.data() : null;
        const previousValue = change.before.exists ? change.before.data() : null;

        if (!newValue) return;

        // 1. Detect if the campaign status changed to 'reserved' (Retailer Accepted)
        const wasReserved = previousValue && previousValue.status === 'reserved';
        if (newValue.status === 'reserved' && !wasReserved) {
            console.log(`Campaign ${context.params.campaignId} reserved by ${newValue.retailerID}`);
            const db = admin.firestore();
            
            // 2. Generate Sales Order in DMS (Mocking by writing to 'sales_orders' collection)
            const orderRef = db.collection('sales_orders').doc();
            
            // Map the frontend fields properly
            const claimedQty = newValue.claimedQuantity || newValue.quantityAvailable || 0;
            const batchID = newValue.batchId || newValue.batchID;
            
            await orderRef.set({
                orderId: `ORD-${Date.now()}`,
                retailerId: newValue.retailerID,
                batchId: batchID,
                claimedQuantity: claimedQty,
                fulfillmentStatus: 'Processing',
                productName: newValue.productName || 'Promotional Product',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Sales order created: ${orderRef.id}`);

            // 3. Inventory Synchronization: Subtract from Available, Move to In-Transit
            if (batchID) {
                const batchRef = db.collection('batches').doc(batchID);
                await db.runTransaction(async (transaction) => {
                    const batchDoc = await transaction.get(batchRef);
                    if (!batchDoc.exists) {
                        throw "Batch document does not exist!";
                    }

                    const currentAvailable = batchDoc.data().availableQuantity || 0;
                    const currentInTransit = batchDoc.data().inTransitQuantity || 0;

                    const newAvailable = Math.max(0, currentAvailable - claimedQty);
                    const newInTransit = currentInTransit + claimedQty;

                    // Update the batch document
                    transaction.update(batchRef, {
                        availableQuantity: newAvailable,
                        inTransitQuantity: newInTransit,
                        status: 'In-Transit'
                    });
                });
                console.log(`Batch ${batchID} inventory synchronized to In-Transit`);
            }
        }
    });
