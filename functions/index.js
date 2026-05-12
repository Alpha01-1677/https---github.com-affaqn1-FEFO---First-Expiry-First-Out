const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// NOTE: The handlePromotionAcceptance Cloud Function logic has been successfully 
// migrated directly into the frontend (retailer_portal.html) within the 
// submitAcceptPromotion function. 
//
// This change was made to allow the DMS Bridge and Inventory Synchronization 
// functionality to work entirely on the Firebase Spark (free) plan, bypassing 
// the need for the Blaze plan which is required for Cloud Functions deployment.
// 
// No further backend deployment is needed for order tracking to work.
