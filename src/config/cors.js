const corsOptions = {
  origin: [
    "https://productsystemmanagementv1.vercel.app",
    "http://localhost:5173/",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};

module.exports = corsOptions;
