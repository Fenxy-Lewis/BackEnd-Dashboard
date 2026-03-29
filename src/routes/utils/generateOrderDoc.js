const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const dayjs = require("dayjs");

const generateOrderDoc = (order) => {



  const templatePath = path.join(__dirname, "../templete/order-template.docx");
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
doc.render({
  orderNumber: order.orderNumber,
  items: order.orderDetails,
  total: order.total,
  f_name: order.customer.firstname,
  l_name: order.customer.lastname,
  email: order.customer.email,
  location:order.location,
  phone: order.customer.phone,
  date: dayjs(order.orderDate).format("DD MMM YYYY"),
});
const buffer = doc.getZip().generate({
  type: "nodebuffer",
  compression:"DEFLATE",
});

return buffer;


};

module.exports = generateOrderDoc;
