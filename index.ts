import Server , {type Request,type Response } from 'express';
import bodyParser from 'body-parser';
const app = Server();
app.use(bodyParser.json());
const PORT = Bun.env.PORT || 3002
app.listen(PORT,()=>console.log(`Servier runnin on http:localhost:${PORT}`))

import { ChargilyClient, verifySignature } from '@chargily/chargily-pay';

const client = new ChargilyClient({
  api_key:  Bun.env.CHARGILY_SECRET_KEY || "",
  mode: 'test', 
});

const API_SECRET_KEY =  Bun.env.CHARGILY_SECRET_KEY || "";
type CustomerModel={
    "id": string,
    "entity": string,
    "livemode": boolean,
    "name": string,
    "email": string|null,
    "phone": string|null,
    "address": {
       "country": string | undefined,
       "state": string| undefined,
       "address": string| undefined,
    },
    "metadata": Record<string,any> | null,
    "created_at": number,
    "updated_at": number
 }
 type ProductModel={

        "id": string,
        "entity": string,
        "livemode": boolean,
        "name": string,
        "description": string | null,
        "images": string[],
        "metadata": Record<string,any>,
        "created_at": number,
        "updated_at": number

 }
 type PriceModel={
        "id": string,
        "entity": string,
        "livemode": boolean,
        "amount": number,
        "currency": string,
        "metadata": Record<string, any>,
        "created_at": number,
        "updated_at": number,
        "product_id": string
     
    
 }
 type CheckOutModel={
    
        "id": string,
        "entity": string,
        "livemode": boolean,
        "amount": number,
        "currency": string,
        "fees": number,
        "fees_on_merchant": number,
        "fees_on_customer": number,
        "pass_fees_to_customer": null,
        "chargily_pay_fees_allocation": string,
        "status": string,
        "locale": string,
        "description": string | null,
        "metadata": Record<string,any> | null,
        "success_url": string,
        "failure_url": string,
        "webhook_endpoint": string| null,
        "payment_method": string|null,
        "invoice_id": string|null,
        "customer_id": string,
        "payment_link_id": string|null,
        "created_at": number,
        "updated_at": number,
        "shipping_address": string| null,
        "collect_shipping_address": number,
        "discount": {
             "type": string,
             "value":number
         },
        "amount_without_discount": number,
        "checkout_url": string
 }
let myCustomer:CustomerModel;
let myProduct:ProductModel;
let myPrice:PriceModel;
let myCheckOut:CheckOutModel;
/* const options = {method: 'GET', headers: {Authorization: "Bearer Bun.env.CHARGILY_SECRET_KEY || ''"}};
 */
/* fetch('https://pay.chargily.net/test/api/v2/balance', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err)); */

app.get("/",(req,res)=>
{res.send("server is running")})  
app.post("/pay",async(req:Request,res:Response)=>{
    if(req.body){
        let clientName =req.body.clientName;
        let clientEmail =req.body.clientEmail;
        let clientPhoneNumber =req.body.clientPhoneNumber;
        let clientDescription =req.body.clientDescription;
        let clientAddress =req.body.clientAddress;
        let price =req.body.price;
        let productQuantity =req.body.productQuantity;
        createCustomer(clientName,clientEmail,clientPhoneNumber,clientDescription,clientAddress)
        createProduct("epay","",[],"epay")
        createPrice(price,"dzd",myProduct.id,new Map());
        let successUrl="";
        let failureUrl="";
        let paymentMethod='edahabia';
        let orderId='edahabia';
        createCheckOut(myPrice.id,productQuantity,successUrl,failureUrl,paymentMethod,clientAddress,orderId,"en");
        
    }
    else{
        res.status(405).json({"message":"bad request, please send a correct data"})
    }
})
  app.post('/webhook', (req: Request, res: Response) => {
    const signature = req.get('signature') || '';
    const payload = (req as any).rawBody;
  
    if (!signature) {
      console.log('Signature header is missing');
      res.sendStatus(400);
      return;
    }
  
    try {
      if (!verifySignature(payload, signature, API_SECRET_KEY)) {
        console.log('Signature is invalid');
        res.sendStatus(403);
        return;
      }
    } catch (error) {
      console.log(
        'Something happened while trying to process the request to the webhook'
      );
      res.sendStatus(403);
      return;
    }
  
    const event = req.body;
    // You can use the event.type here to implement your own logic
    console.log(event);
  
    res.sendStatus(200);
  });
  
function createCustomer(clientName:string,
    clientEmail:string,clientPhoneNumber:number,clientDescription:string,clientAddress:string){
    const customerData = {
        name: clientName,
        email: clientEmail,
        phone: clientPhoneNumber.toString(),
        address: {
          country: 'DZ',
          state: 'Algiers',
          address: clientAddress,
        },
        metadata: {
          notes: clientDescription,
        },
      };
      
      client
        .createCustomer(customerData)
        .then((customer) => {
            console.log(customer)
            myCustomer={
"id": customer.id,
    "entity": customer.entity,
    "livemode": false,
    "name": customer.name,
    "email": customer.email,
    "phone": customer.phone,
    "address": {
       "country": customer.address?.country,
       "state": customer.address?.state,
       "address": customer.address?.address
    },
    "metadata": customer.metadata,
    "created_at": customer.created_at,
    "updated_at": customer.updated_at
            };
            
        })
        .catch((error) => console.error(error));
}  
function createProduct(
    productName:string,
    productDescription:string,
    productImages : string[],
    productCategory:string
){

    const productData = {
        name: productName,
        description: productDescription,
        images:productImages,
        metadata: { category: productCategory },
      };
      
      client
        .createProduct(productData)
        .then((product) => {
            
            console.log(product)
            myProduct={
                
                    "id": product.id,
                    "entity": product.entity,
                    "livemode": product.livemode,
                    "name": product.name,
                    "description": product.description,
                    "images": product.images,
                    "metadata": product.metadata,
                    "created_at": product.created_at,
                    "updated_at": product.updated_at
                
            }
        })
        .catch((error) => console.error(error));
}
async function createPrice(
    amount:number,
    currency:string,
    productId:string,
    description:Map<String,any>
){
    await client.createPrice({
        amount: amount,
        currency: currency,
        product_id: productId,
        metadata: description,
      }).then((price)=>{
        console.log(price);
        
        myPrice=price as PriceModel;
      }).catch(e=>console.log(e));
}

async function createCheckOut(
    priceId:string,
    quantity:number,
    successUrl:string,
    failureUrl:string,
    paymentMethod:string,
    address:string,
    orderId:string,
    locale:"ar" | "fr" | "en" ,

){
    await client.createCheckout({
        items: [
          {
            price: priceId,
            quantity: quantity,
          },
        ],
        success_url: successUrl,
        failure_url: failureUrl,
        payment_method: paymentMethod, // Optional, defaults to 'edahabia'
        locale: locale, // Optional, defaults to 'ar'
        pass_fees_to_customer: true, // Optional, defaults to false
        shipping_address: address, // Optional
        collect_shipping_address: true, // Optional, defaults to false
        metadata: {
          order_id: orderId,
        },}).then((checkout)=>{
            console.log(checkout);
            myCheckOut=myCheckOut as CheckOutModel;
            
        }).catch((e) => {
            console.log(e);
            
        });
}