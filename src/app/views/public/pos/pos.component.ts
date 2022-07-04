import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as moment from 'moment';
import { Category, Product } from 'src/app/core/models';
import { FirebaseService, NotifyService } from 'src/app/core/services';
import Swal from 'sweetalert2'
import axios from 'axios';

import { CartcheckoutService } from '../services/cartcheckout.service';

import { PrimeNGConfig } from "primeng/api"

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {

  paymentHandler: any = null;
 
  success: boolean = false
  
  failure:boolean = false

  products : any;
  content: any = null;
  basket: any = [];
  backup : any = [];
  cartTotal: number;
  cartNumItems: number;


  categories: any;

  constructor(
    private firestore : FirebaseService,
    private notify : NotifyService,
    private afs: AngularFirestore,
    private primengConfig: PrimeNGConfig,
    private cartcheckout: CartcheckoutService
  ) { }

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.invokeStripe();
    this.products = [{
      id: 1,
      category: 'Food',
      icon : 'nav-home-tab',
      content : [{
        id: 1,
        name : 'Chicken',
        image : 'assets/img/chicken.jpeg',
        quantity : 1,
        price : 5,
        available : true,
        stock : 200,
      },{
        id: 1,
        name : 'fish',
        price : 2000,
        image : 'assets/img/chicken.jpeg',
        quantity: 1,
        available : true,
        stock : 10,
      }],
    },{
      id: 2,
      category: 'Drink',
      icon : 'nav-home-tab',
    }]
    this.content = this.products[0].content;

    this.firestore.getDocuments("category")
      .then((data) => {
        if (data.length === 0) {
          console.log(data);
        }
        else {
          console.log(data);
        }
      })
      .catch(err => {
        this.notify.error2("Oup's une erreur est survenu :(");
      });

      this.fetch();
  }

  geeks: boolean;
  
  gfg() {
    this.geeks = true;
  }

  mobileNumber: string = '';

  onNameKeyUp(event: any) {
    this.mobileNumber = event.target.value;
  }

  postMobileNumber() {
    this.checkout();
  }

  makePayment(amount: number) {
    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: 'pk_test_51KjjqoSF4Sl9UBFs1coMR9v3ErLsVzlyjRp1ZouPPE9lWqtgstOYNNm0gd3G1bXeSQjz8Su4Gp6gxhOVRX3HGjW100DPqJo4c5',
      locale: 'auto',
      token: function (stripeToken: any) {
        console.log(stripeToken);
        paymentstripe(stripeToken);
      },
    });
 
    const paymentstripe = (stripeToken: any) => {
      this.cartcheckout.makePayment(stripeToken).subscribe((data: any) => {
        console.log(data);
        if (data.data === "success") {
          this.success = true
        }
        else {
          this.failure = true
        }
      });
    };
 
    paymentHandler.open({
      name: 'POS by Karthikeyan',
      amount: amount * 100,
    });
  }

  invokeStripe() {
    if (!window.document.getElementById('stripe-script')) {
      const script = window.document.createElement('script');
      script.id = 'stripe-script';
      script.type = 'text/javascript';
      script.src = 'https://checkout.stripe.com/checkout.js';
      script.onload = () => {
        this.paymentHandler = (<any>window).StripeCheckout.configure({
          key: 'pk_test_51KjjqoSF4Sl9UBFs1coMR9v3ErLsVzlyjRp1ZouPPE9lWqtgstOYNNm0gd3G1bXeSQjz8Su4Gp6gxhOVRX3HGjW100DPqJo4c5',
          locale: 'auto',
          token: function (stripeToken: any) {
            console.log(stripeToken);
          },
        });
      };
 
      window.document.body.appendChild(script);
    }
  }

  fetch(){
    this.afs.collection('categories').valueChanges().subscribe((res : any) => {
      this.categories = res;
      console.log(this.categories);
        this.categories.forEach(async (element, key) => {
          this.categories[key].products = await this.findProducts(element.id);
        });
    });
  }

  async findProducts(category){
    return new Promise(resolve => {
      this.afs.collection('products', ref => ref.where('category', '==', category)).valueChanges().subscribe((res : any) => {
        resolve(res);
      });
    });
  }

  show(item){
    this.content = item.content;
  }

  panier(a){
    a = { quantity: 1, ...a }
    if(this.basket == '' || this.basket == null){
      this.backup.push(a);
      this.basket.push(a);
    } else {
      var isPresent = this.basket.some(function (el) { return el.name === a.name });
      console.log(isPresent);
      if(isPresent == false){
        this.backup.push(a);
        this.basket.push(a);
      }
    }
    this.calculateTotal();
  }

  /*add(x){
    x.quantity = x.quantity + 1;
    var isp = this.backup.some(function (el) {
      if (el.name === x.name ){
        var p = el.price;
        x.price = p * x.quantity;
        return x.price;
      }
    });

    console.log(isp);

  }*/

  add(x) {
    // If the item already exists, add 1 to quantity
    if (this.basket.includes(x)) {
      this.basket[this.basket.indexOf(x)].quantity += 1;
      console.log(x);
    } else {
      this.basket.push(x);
    }
    this.calculateTotal();
  }

  reduce(x) {
    // Check if last item, if so, use remove method
    if (this.basket[this.basket.indexOf(x)].quantity === 1) {
      this.remove(x);
    } else {
      this.basket[this.basket.indexOf(x)].quantity = this.basket[this.basket.indexOf(x)].quantity - 1;
    }
    this.calculateTotal();
  }

  remove(x) {
    // Check if item is in array
    if (this.basket.includes(x)) {
      // Splice the element out of the array
      const index = this.basket.indexOf(x);
      if (index > -1) {
        // Set item quantity back to 1 (thus when readded, quantity isn't 0)
        this.basket[this.basket.indexOf(x)].quantity = 1;
        this.basket.splice(index, 1);
      }
    }
    this.calculateTotal();
  }

  calculateTotal() {
    let total = 0;
    let cartitems = 0;
    // Multiply item price by item quantity, add to total
    this.basket.forEach(function (x) {
      total += (x.price * x.quantity);
      cartitems += x.quantity;
    });
    this.cartTotal = total;
    this.cartNumItems = cartitems;
  }

  // Remove all items from cart
  clearCart() {
    // Reduce back to initial quantity (1 vs 0 for re-add)
    this.basket.forEach(function (x) {
      x.quantity = 1;
    });
    // Empty local ticket variable then sync
    this.basket = [];
    this.calculateTotal();
  }

  checkout() {
    if (this.basket.length > 0) {
      //Pay
      this.saveOrder(this.basket);
      
    } else {
      Swal.fire("Empty", "", "error");
    }
  }

  stripeCheckoutSession = async () => {
    const res = await fetch(`http://localhost:5005/checkout`, {
      method: 'POST',
      headers: {
        "Content-Type": 'application/json'
      }
    })
    const body = await res.json()
    window.location.href = body.url
  }

  saveOrder(basket: any){
    console.log('Items Added to Card Successfully');
    let data = {
      carts: JSON.stringify(basket),
      id: this.afs.createId(),
      orderId: this.afs.createId(),
      amount: this.cartTotal,
      phoneNumber: this.mobileNumber,
      status: true,
      created_at: moment().format(),
      updated_at: moment().format()      
    };
    console.log(this.mobileNumber);
    var rawData = JSON.stringify(basket);
    var catList = JSON.parse(rawData);

    console.log(data.carts)

    // var item0 = "Name" + " " + "|" + "Quantity" + " " + "|" + "Price"
    
    // var cat1 = catList[0]["name"];
    // var q1 = catList[0]["quantity"];
    // var amt1 = catList[0]["price"]; 
    // var item1 = cat1 + " " + "|" +  q1 + " " + "|"  + amt1;
    // console.table(catList);

    // var cat2 = catList[1]["name"];
    // var q2 = catList[1]["quantity"];
    // var amt2 = catList[1]["price"]; 
    // var item2 = cat2 + " " + "|" +  q2 + " " + "|"  + amt2;

    // var productsPurchased = item0 + "\n\n" + item1 + "\n" + item2;
    // console.table(productsPurchased);

    console.log(this.cartTotal);

    var postData = {
      carts: data.carts,
      id: data.id,
      orderId: data.orderId,
      productsPurchased: catList,
      amount: data.amount,
      number: data.phoneNumber,
      cartTotal: this.cartTotal,
    };

    let axiosConfig = {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      }
    };
    
    let checkoutaxiosConfig = {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      }
    };
    //mongoose
    axios.post('http://localhost:5000/sales', postData, axiosConfig)
    .then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    })
    //whatsapp
    axios.post('http://localhost:5001/saleDetails', postData, axiosConfig)
    .then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    })
    //payment
    axios.post('http://localhost:5005/getAmount', postData, checkoutaxiosConfig)
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    })

    this.stripeCheckoutSession();

    this.afs.collection("sales").doc(data.id).set(data).then(() => {
      // Swal.fire("OK", "", "success").then(()=> location.reload());
    }, err => {
      this.notify.error2("Oup's une erreur est survenu :(");
    });
  }




}
