require('dotenv/config');

const apiKey = process.env.TELNYX_API_KEY;
const outboundProfileId = '2907995328512787493';

async function main() {
  console.log('Adding ZA (South Africa) to outbound voice profile whitelisted destinations...');
  
  const r = await fetch(`https://api.telnyx.com/v2/outbound_voice_profiles/${outboundProfileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      whitelisted_destinations: ['US', 'CA', 'ZA', 'GB', 'AU']
    })
  });
  const d = await r.json();
  
  if (d.data) {
    console.log('Success! Profile updated:');
    console.log('Name:', d.data.name);
    console.log('Whitelisted destinations:', d.data.whitelisted_destinations);
  } else {
    console.log('Error response:', JSON.stringify(d, null, 2));
  }

  // Now try to link the profile to the credential connection using the correct field name
  console.log('\nLinking profile to credential connection...');
  const connId = process.env.TELNYX_SIP_CONNECTION_ID;
  const r2 = await fetch(`https://api.telnyx.com/v2/credential_connections/${connId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      outbound: {
        outbound_voice_profile_id: outboundProfileId
      }
    })
  });
  const d2 = await r2.json();
  if (d2.data) {
    console.log('Connection updated:');
    console.log('Outbound profile (nested):', JSON.stringify(d2.data.outbound));
  } else {
    console.log('Error:', JSON.stringify(d2, null, 2).slice(0, 400));
  }
}

main().catch(e => console.error(e.message));
