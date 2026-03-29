const app = require("express");
const router = app.Router();
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { Products, category, ProductImage } = require("../../models");

// Image Upload Route
router.post("/:id/upload", async (req, res) => {
  try {
    const { file} = req.files;
    const productId = req.params.id;
    const product = await Products.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });const { Product, Category, ProductImage } = require("../../models");
    }
    const fileName = `${uuidv4()}${path.extname(file.name)}`;
    const uploadPath = path.join(process.cwd(), "uploads/products", fileName);
    await file.mv(uploadPath);

    const domain = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${domain}/uploads/products/${fileName}`;
    const savedImageUrl = await ProductImage.create({
      productId,
      fileName: file.name,
      imageUrl,
    });
    res.status(200).json({
      message: "Image uploaded successfully",
      data: savedImageUrl,
    });
  } catch (error) {
    console.error("Error in /upload:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Image Delete
router.delete("/:id/delete",async (req,res)=>{
  try {
    const {id} = req.params;
    const image = await ProductImage.findByPk(id);
    if(!image){
      return res.status(404).json({message: `Image with id ${id} not found`});
    };
    const fileName = image.imageUrl.split('/').pop();
    const imagePath = path.join(process.cwd(), "uploads/products", fileName);
    if(!fs.existsSync(imagePath)){
      return res.status(404).json({
        message: "Image file not found on server"
      })
    };
    fs.unlinkSync(imagePath);
    await image.destroy();
    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error in /:id/delete:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Image link download route
router.get("/images/:imageId/download",async (req,res)=>{
  try {
    const {imageId} = req.params;
    const image = await ProductImage.findByPk(imageId);
    if(!image){
      return res.status(404).json({message: `Image with id ${imageId} not found`});
    };
    const fileName = image.imageUrl.split('/').pop();
    const imagePath = path.join(process.cwd(), "uploads/products", fileName);
    if(!fs.existsSync(imagePath)){
      return res.status(404).json({
        message: "Image file not found on server"
      })
    };
    res.download(imagePath,image.fileName);
  } catch (error) {
    console.error("Error in /:id/images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
