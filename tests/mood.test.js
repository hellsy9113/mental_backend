const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const jwt = require("jsonwebtoken");

let token;
let user;

beforeEach(async () => {
  user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "123456",
  });

  token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "super_strong_random_secret_123"
  );
});

describe("Mood API Integration Test", () => {

  test("Should add mood entry", async () => {
    const res = await request(app)
      .post("/api/mood")
      .set("Authorization", `Bearer ${token}`)
      .send({ moodScore: 8 });
   console.log(res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.moodScore).toBe(8);
  });

  test("Should calculate weekly stats", async () => {

    // Add multiple moods
    await request(app)
      .post("/api/mood")
      .set("Authorization", `Bearer ${token}`)
      .send({ moodScore: 6 });

     

    await request(app)
      .post("/api/mood")
      .set("Authorization", `Bearer ${token}`)
      .send({ moodScore: 8 });

    const res = await request(app)
      .get("/api/mood/stats")
      .set("Authorization", `Bearer ${token}`);
    
       console.log(res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.weekly).toBe(7); // avg(6,8)
  });

});
