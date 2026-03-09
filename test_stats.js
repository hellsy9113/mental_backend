async function test() {
    try {
        const email = `test_${Date.now()}@test.com`;
        const res = await fetch('http://localhost:3000/auth/register', {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: 'Test', email, password: 'password', role: 'student' })
        });
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: 'password' })
        });
        const { token } = await loginRes.json();

        await fetch('http://localhost:3000/api/mood', {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ moodScore: 8 })
        });

        const statsRes = await fetch('http://localhost:3000/api/mood/stats', {
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log('Stats:', await statsRes.json());
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
