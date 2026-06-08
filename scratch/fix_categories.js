const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fix() {
  console.log('Starting category fix...');
  const snap = await db.collection('promotion_interactions').get();
  
  for (const doc of snap.docs) {
    const data = doc.data();
    const productName = data.productName || '';
    const parts = productName.trim().split(/\s+/);
    let newCategory = 'General';
    if (parts[0].toLowerCase() === 'nestle' && parts.length > 1) {
      let cat = parts[1];
      if (cat.toLowerCase() === 'fresh' && parts[2]?.toLowerCase() === 'milk') {
        newCategory = 'Milk';
      } else {
        newCategory = cat;
      }
    } else {
      newCategory = parts[0] || 'General';
    }
    
    console.log(`Updating document ${doc.id}: "${productName}" -> category: "${newCategory}"`);
    await doc.ref.update({ category: newCategory });
  }
  
  console.log('Fix complete!');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
