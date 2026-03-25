require('dotenv/config');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const auth = Buffer.from(accountSid + ':' + authToken).toString('base64');
const numberToBuy = '+27110876369';

async function main() {
  console.log('Purchasing Twilio number:', numberToBuy);

  const body = new URLSearchParams({
    PhoneNumber: numberToBuy,
    FriendlyName: 'Chorus AI Webphone (Gauteng)',
  });

  const r = await fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/IncomingPhoneNumbers.json',
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );
  const d = await r.json();

  if (d.phone_number) {
    console.log('\n✅ Number purchased successfully!');
    console.log('Phone Number:', d.phone_number);
    console.log('Friendly Name:', d.friendly_name);
    console.log('SID:', d.sid);
    console.log('Capabilities:', JSON.stringify(d.capabilities));
    console.log('\nNext: Update TWILIO_CALLER_ID to', d.phone_number);
  } else {
    console.log('Error purchasing number:', JSON.stringify(d, null, 2));
  }
}

main().catch(e => console.error(e.message));
