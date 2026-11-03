async function test() {
  const routes = ['/', '/menu', '/about-us', '/contact-us', '/faq', '/blog', '/privacy-policy', '/404'];
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:5173${r}`);
      console.log(`Route ${r}: status ${res.status}`);
    } catch (e) {
      console.error(`Route ${r} failed:`, e.message);
    }
  }
}
test();
