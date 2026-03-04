require('dotenv/config');

const apiKey = process.env.TELNYX_API_KEY;
const connId = process.env.TELNYX_SIP_CONNECTION_ID;
const outboundProfileId = '2907995328512787493';

async function main() {
  console.log('Linking outbound voice profile to credential connection...');
  
  // Update the credential connection to use the outbound voice profile
  const r = await fetch(`https://api.telnyx.com/v2/credential_connections/${connId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      outbound_voice_profile_id: outboundProfileId
    })
  });
  const d = await r.json();
  
  if (d.data) {
    console.log('Success! Connection updated:');
    console.log('Name:', d.data.connection_name);
    console.log('Active:', d.data.active);
    console.log('Outbound Voice Profile ID:', d.data.outbound_voice_profile_id);
  } else {
    console.log('Error response:', JSON.stringify(d, null, 2));
  }

  // Also check what numbers are in the outbound voice profile
  const r2 = await fetch(`https://api.telnyx.com/v2/outbound_voice_profiles/${outboundProfileId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const d2 = await r2.json();
  if (d2.data) {
    console.log('\nOutbound Voice Profile details:');
    console.log('Name:', d2.data.name);
    console.log('Enabled:', d2.data.enabled);
    console.log('Whitelisted destinations:', d2.data.whitelisted_destinations);
    console.log('Call recording enabled:', d2.data.call_recording?.call_recording_enabled);
  }
}

main().catch(e => console.error(e.message));
