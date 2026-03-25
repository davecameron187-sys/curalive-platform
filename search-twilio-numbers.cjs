require('dotenv/config');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const auth = Buffer.from(accountSid + ':' + authToken).toString('base64');

async function main() {
  console.log('Searching for available South African numbers...\n');

  // Search for SA local numbers
  const r = await fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/AvailablePhoneNumbers/ZA/Local.json?PageSize=5',
    { headers: { Authorization: 'Basic ' + auth } }
  );
  const d = await r.json();

  if (d.available_phone_numbers && d.available_phone_numbers.length > 0) {
    console.log('=== Available SA Local Numbers ===');
    d.available_phone_numbers.forEach((n, i) => {
      console.log(`${i + 1}. ${n.phone_number} | ${n.friendly_name} | Region: ${n.region} | Monthly: $${n.price_unit}`);
    });
  } else {
    console.log('SA Local response:', JSON.stringify(d).slice(0, 400));
    
    // Try mobile numbers
    const r2 = await fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/AvailablePhoneNumbers/ZA/Mobile.json?PageSize=5',
      { headers: { Authorization: 'Basic ' + auth } }
    );
    const d2 = await r2.json();
    if (d2.available_phone_numbers && d2.available_phone_numbers.length > 0) {
      console.log('=== Available SA Mobile Numbers ===');
      d2.available_phone_numbers.forEach((n, i) => {
        console.log(`${i + 1}. ${n.phone_number} | ${n.friendly_name} | Region: ${n.region}`);
      });
    } else {
      console.log('SA Mobile response:', JSON.stringify(d2).slice(0, 400));
    }
  }

  // Also check US numbers as fallback
  const r3 = await fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/AvailablePhoneNumbers/US/Local.json?PageSize=3',
    { headers: { Authorization: 'Basic ' + auth } }
  );
  const d3 = await r3.json();
  if (d3.available_phone_numbers && d3.available_phone_numbers.length > 0) {
    console.log('\n=== Available US Numbers (fallback) ===');
    d3.available_phone_numbers.forEach((n, i) => {
      console.log(`${i + 1}. ${n.phone_number} | ${n.friendly_name}`);
    });
  }
}

main().catch(e => console.error(e.message));
