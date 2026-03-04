require('dotenv/config');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const auth = Buffer.from(accountSid + ':' + authToken).toString('base64');

async function main() {
  // Step 1: Create an address
  console.log('Step 1: Registering address...');
  const addrBody = new URLSearchParams({
    CustomerName: 'Chorus AI',
    Street: '41 Rooigras Avenue',
    City: 'Johannesburg',
    Region: 'Gauteng',
    PostalCode: '2090',
    IsoCountry: 'ZA',
    FriendlyName: 'Chorus AI - Bassonia',
  });

  const r1 = await fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Addresses.json',
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: addrBody.toString(),
    }
  );
  const addr = await r1.json();

  if (!addr.sid) {
    console.log('Error creating address:', JSON.stringify(addr, null, 2));
    return;
  }
  console.log('✅ Address created! SID:', addr.sid);
  console.log('  ', addr.street + ', ' + addr.city + ', ' + addr.region + ' ' + addr.postal_code);

  // Step 2: Purchase the number with the address
  console.log('\nStep 2: Purchasing +27110876369 (Gauteng)...');
  const numBody = new URLSearchParams({
    PhoneNumber: '+27110876369',
    FriendlyName: 'Chorus AI Webphone (Gauteng)',
    AddressSid: addr.sid,
  });

  const r2 = await fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/IncomingPhoneNumbers.json',
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: numBody.toString(),
    }
  );
  const num = await r2.json();

  if (num.phone_number) {
    console.log('\n✅ Number purchased successfully!');
    console.log('Phone Number:', num.phone_number);
    console.log('Friendly Name:', num.friendly_name);
    console.log('SID:', num.sid);
    console.log('Voice Capable:', num.capabilities?.voice);
    console.log('\nUpdate TWILIO_CALLER_ID to:', num.phone_number);
  } else {
    console.log('Error purchasing number:', JSON.stringify(num, null, 2));
  }
}

main().catch(e => console.error(e.message));
