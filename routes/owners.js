// const express = require("express");
// const router = express.Router();
// const { Owner, validateOwner } = require("../models/owner");

// // POST /api/owners/register - Register a new owner
// router.post("/register", async (req, res) => {
//   const { error } = validateOwner(req.body);
//   if (error) return res.status(400).send(error.details[0].message);

//   const existingOwner = await Owner.findOne({ email: req.body.email });
//   if (existingOwner)
//     return res.status(400).send("Owner with this email already exists");

//   const owner = new Owner({
//     name: req.body.name,
//     email: req.body.email,
//     phone: req.body.phone,
//     password: req.body.password,
//   });

//   try {
//     await owner.save();
//     res.status(201).send("Owner registered successfully");
//   } catch (err) {
//     res.status(500).send("Something went wrong: " + err.message);
//   }
// });

// // GET /api/owners - Fetch all owners (for testing/admin purposes)
// router.get("/", async (req, res) => {
//   try {
//     const owners = await Owner.find().select("-password"); // hide passwords
//     res.send(owners);
//   } catch (err) {
//     res.status(500).send("Failed to retrieve owners: " + err.message);
//   }
// });

// module.exports = router;
