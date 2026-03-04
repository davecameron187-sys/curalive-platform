require('dotenv/config');

const apiKey = process.env.TELNYX_API_KEY;
const connId = process.env.TELNYX_SIP_CONNECTION_ID;
const sipUser = process.env.TELNYX_SIP_USERNAME;

console.log('API Key set:', !!apiKey);
console.log('Connection ID:', connId);
console.log('SIP Username:', sipUser);

async function main() {
  // Try credential_connections (SIP username/password type)
  const r1 = await fetch(`https://api.telnyx.com/v2/credential_connections/${connId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const d1 = await r1.json();
  if (d1.data) {
    const c = d1.data;
    console.log('\n=== Credential Connection ===');
    console.log('Name:', c.connection_name);
    console.log('Active:', c.active);
    console.log('Type:', c.record_type);
    console.log('Outbound Voice Profile ID:', c.outbound_voice_profile_id);
    console.log('SIP Username:', c.user_name);
  } else {
    console.log('credential_connections response:', JSON.stringify(d1).slice(0, 400));
  }

  // Check outbound voice profiles
  const r2 = await fetch('https://api.telnyx.com/v2/outbound_voice_profiles', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const d2 = await r2.json();
  console.log('\n=== Outbound Voice Profiles ===');
  (d2.data || []).forEach(p => {
    console.log('ID:', p.id, '| Name:', p.name, '| Enabled:', p.enabled, '| Numbers:', p.numbers_count);
  });

  // Check phone numbers
  const r3 = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=5', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const d3 = await r3.json();
  console.log('\n=== Phone Numbers ===');
  (d3.data || []).forEach(n => {
    console.log('Number:', n.phone_number, '| Status:', n.status, '| Connection ID:', n.connection_id);
  });
}

main().catch(e => console.error(e.message));
