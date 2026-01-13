const testPayload = {
  "messageId":"ac2fe68a8ac8483faf36daabea3da926",
  "messageType":"UPDATE",
  "openId":31013,
  "params":{
    "categoryId":"test",
    "categoryName":"test",
    "fields":[],
    "pid":"test",
    "productDescription":"test",
    "productImage":"test",
    "productName":"test",
    "productNameEn":"test",
    "productProperty1":"test",
    "productPropertyEn":"test",
    "productSellPrice":"1-10",
    "productSku":"test",
    "productStatus":"3",
    "productType":"0",
    "saleStatus":"3"
  },
  "type":"PRODUCT"
};

const params = testPayload.params || {};
const {
  pid: productId,
  productSku: sku,
  productName,
  productSellPrice: sellPrice,
  productImage,
  productStatus,
  description: productDescription,
} = params;

console.log({productId, sku, productName, sellPrice, productImage, productStatus, productDescription});
console.log('Test:', productId === 'test' || sku === 'test');
