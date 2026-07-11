const http = require('http');

http.get('http://localhost:5000/api/stories', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Status:', res.statusCode);
      console.log('Stories count:', json.stories?.length);
      json.stories?.forEach((s, idx) => {
        console.log(`${idx + 1}. Title: "${s.title}" | Language: ${s.language?.code || 'None'} | Published: ${s.isPublished}`);
      });
    } catch(e) {
      console.log('Error parsing response:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('HTTP Error:', e.message);
});
