var week=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var thisdate=new Date();
var thismonth =thisdate.getMonth();
var thisyear=thisdate.getFullYear();
var todaysdate=thisdate.getDate();
function getDaysInMonth(month, year) {
  var date = new Date(year, month, 1);
  var days = [];
  while (date.getMonth() === month) {
    days.push(week[new Date(date).getDay()]);
    date.setDate(date.getDate() + 1);
  }
  return days;
};
function pattern(){
  var order=getDaysInMonth(thismonth,thisyear);
  var result=[];
  for(var i=0;i<order.length;i++)
  {
    result.push(i+1+"/"+(thismonth+1)+"   "+order[i]);

  }
  return result;
};
const express=require('express');
const body=require('body-parser');
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportlm=require('passport-local-mongoose');
const app=express();
app.use(body.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(session({
  secret:"Our Little secret.",
  resave:false,
  saveUninitialized:false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/aasthajal");
const monthlyschema=new mongoose.Schema({
  username:String,
  password:String
});
const itemSchema = new mongoose.Schema({
    name : String
});
const instantitemschema = new mongoose.Schema({
    name : String,
    quantity:Number
});
const userschema=new mongoose.Schema({
  email:String,
  name: String,
  address:String,
  order:[itemSchema],
  done:[itemSchema]
});
const iuserschema=new mongoose.Schema({
  email:String,
  name: String,
  address:String,
  order:[instantitemschema]
});

monthlyschema.plugin(passportlm);
const Month= mongoose.model("Month",monthlyschema);
const Instant= mongoose.model("Instant",monthlyschema);
const Item = mongoose.model("Item", itemSchema);
const Order= mongoose.model("Order",instantitemschema);
const Muser=mongoose.model("Muser",userschema);
const Iuser=mongoose.model("Iuser",iuserschema);
const Authinstant=mongoose.model("Authinstant", itemSchema);
const myLocalStrategy1=Month.createStrategy();
const myLocalStrategy2=Instant.createStrategy();
passport.use('local.one', myLocalStrategy1);
passport.use('local.two', myLocalStrategy2);
passport.serializeUser(Month.serializeUser());
passport.deserializeUser(Month.deserializeUser());
passport.serializeUser(Instant.serializeUser());
passport.deserializeUser(Instant.deserializeUser());
function reset(){
  Muser.updateMany({}, {$set:{done:[]}},function(err, success){
        if(err){
            console.log(err);
        }else{
            console.log(success);
        }
    });

  var temp = pattern();
  var final = [];
  for(var i=0;i<temp.length;i++){
      const it = new Item({
          name: temp[i]
      });
      final.push(it);
  }
  Muser.updateMany({}, {$set:{order:final}},function(err, success){
        if(err){
            console.log(err);
        }else{
            console.log(success);
        }
    });

  console.log('reset');
}
if(todaysdate===1)
{
  reset();
}

app.get("/",function(req,res){
  res.render("welcome");
});
app.get("/subscribe/:id",function(req,res){
  if(req.isAuthenticated())
  {
      res.render("subscribe",{subroot:"/subscribe/"+req.params.id});
  }
  else {
    res.redirect("/");
  }

});
app.get("/monthly/:id",function(req,res){
  console.log(req);
  if(req.isAuthenticated())
  {
    Muser.findOne({email:req.params.id},function(err,foundmuser){
      if(!err)
      {
        if(foundmuser)
        {
          console.log(foundmuser.done);
          res.render("monthly",{name:foundmuser.name,address:foundmuser.address,undeli:foundmuser.order,monthroot:"/delivered/"+req.params.id,deli:foundmuser.done,id:foundmuser.email});
        }
        else {
          res.render("subscribe",{subroot:"/subscribe/"+req.params.id});
        }
      }
      else {
        console.log(err);
      }
    });

  }
  else {
    res.redirect("/");
  }
});
app.post("/delivered/:id", function(req, res){
    var table = req.body.name;
    Muser.findOneAndUpdate({email: req.params.id}, {$pull: {order : {name : table}}}, function(err, doc){
        if(!err){

          res.redirect("/monthly/"+req.params.id);
        }
      });
    const doneitem=new Item({
      name:table
    });
    Muser.updateOne({email: req.params.id}, {$push: {done: doneitem}}, function(err, success){
          if(err){
              console.log(err);
          }else{
              console.log(success);
          }
      });



});

app.post("/subscribe/:id",function(req,res){

  var temp = pattern();
  var final = [];
  for(var i=0;i<temp.length;i++){
      const it = new Item({
          name: temp[i]
      });
      final.push(it);
  }

  const newmuser = new Muser({
      email: req.params.id,
      name: req.body.name,
      address: req.body.address,
      order: final,
      done:[]
  });
    newmuser.save();
    res.redirect("/monthly/"+newmuser.email);

});
app.post("/login/:id",function(req,res){
  var name=req.params.id;
  console.log(name);
  if(name==="msignup")
  {
    res.render("login",{login:"SIGN UP",root:"/setup/msignup",err:""});
    }
  else if (name==="mlogin"){
      res.render("login",{login:"LOG IN",root:"/setup/mlogin",err:""});
  }
  else if (name==="ilogin"){
      res.render("login",{login:"LOG IN",root:"/setup/ilogin",err:""});
  }
  else if (name==="isignup"){
      res.render("login",{login:"SIGN UP",root:"/setup/isignup",err:""});
  }
});
app.post("/setup/msignup",function(req,res){
  console.log("msignup");
  var x=req.body.username;
  var y=req.body.password;
  Month.register({username:req.body.username},req.body.password,function(err,newmonth){
    if(err)
    {
      console.log(err);
      res.redirect("/err/msignup");
    }
    else {
      passport.authenticate("local.one")(req,res,function(){
        console.log("signup month success");
        res.redirect("/subscribe/"+req.body.username);
      });
    }
  });
});
app.post("/setup/mlogin",function(req,res){
  console.log("mlogin");
  const newmonth=new Month({
    username:req.body.username,
    paaword:req.body.password
  });
  req.login(newmonth,function(err){
   if(err)
   {
     console.log(err);
     res.redirect("/");

   }
   else {
     passport.authenticate("local.one", {failureRedirect: "/err/mlogin"})(req,res,function(){
       console.log("login month success");
       res.redirect("/monthly/"+newmonth.username);
     });
   }
  });
});
app.post("/setup/isignup",function(req,res){
  Instant.register({username:req.body.username},req.body.password,function(err,newinstant){
    if(err)
    {
      console.log(err);
      res.redirect("/err/isignup");
    }
    else {
      passport.authenticate("local.two")(req,res,function(){
        console.log("signup instant success");
        const login=new Authinstant({
          name:req.body.username,
        });
        login.save();
        res.redirect("/instant/"+req.body.username);
      });
    }
  });
});
app.post("/setup/ilogin",function(req,res){
  const newinstant=new Instant({
    username:req.body.username,
    paaword:req.body.password
  });
  req.login(newinstant,function(err){
   if(err)
   {
     console.log(err);
     res.redirect("/");
   }
   else {
     passport.authenticate("local.two",{failureRedirect: "/err/ilogin"})(req,res,function(){
       console.log("login instant success");
       const login=new Authinstant({
         name:req.body.username,
       });
       login.save();
       res.redirect("/instant/"+req.body.username);
     });
   }
  });
});
//error handling
app.get("/err/msignup",function(req,res){
res.render("login",{login:"SIGN UP",root:"/setup/msignup",err:"USERNAME ALREADY EXISTS"});
});
app.get("/err/mlogin",function(req,res){
  res.render("login",{login:"LOG IN",root:"/setup/mlogin",err:"INVALID USERNAME OR PASSWORD"});
});
app.get("/err/isignup",function(req,res){
  res.render("login",{login:"SIGN UP",root:"/setup/isignup",err:"USERNAME ALREADY EXISTS"});
});
app.get("/err/ilogin",function(req,res){
  res.render("login",{login:"LOG IN",root:"/setup/ilogin",err:"INVALID USERNAME OR PASSWORD"});
});
//error handling
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});
app.get("/unsubscribe/:id",function(req,res){
  var username=req.params.id;
  Muser.deleteOne({email:username},function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      res.redirect("/monthly/"+username);
    }
  });
});
app.get("/delete/subscribe/:id",function(req,res){

  var username=req.params.id;
  Month.deleteOne({username:username},function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      res.redirect("/");
    }
  });

});

                          ////////////////// INSTANT ORDERS PAGES////////////////////
var stringdate=todaysdate+"/"+(thismonth+1)+"/"+thisyear;
app.get("/instant/:id",function(req,res){

  Authinstant.findOne({name:req.params.id},function(err,found){
    if(!err)
    {
      if(found)
      {
        Iuser.findOne({email:req.params.id},function(err,foundiuser){
          if(!err)
          {
            if(foundiuser)
            {

              res.render("instant",{welnote:"Welcome Back!",name:foundiuser.name,add:foundiuser.address,id:req.params.id});
            }
            else {
              res.render("instant",{welnote:"Welcome",name:"",add:"",id:req.params.id});
            }
          }
          else {
            console.log(err);
          }
        });
      }
      else {
        res.redirect("/");
      }
    }
    else {
      res.redirect("/");
    }
  });
});
app.post("/iorder/:id",function(req,res){
  Iuser.findOne({email:req.params.id},function(err,foundiuser){
    if(!err)
    {
      if(foundiuser)
      {
        const neworder=new Order({
          name:stringdate,
          quantity:req.body.quantity
        });
        Iuser.updateOne({email: req.params.id}, {$push: {order:neworder}}, function(err, success){
              if(err){
                  console.log(err);
              }else{
                  console.log(success);
              }
          });
      }
      else
       {
         const neworder=new Order({
           name:stringdate,
           quantity:req.body.quantity
         });
        const newiuser=new Iuser({
          email:req.params.id,
          name:req.body.name,
          address:req.body.address,
          order:[neworder]
        });
        newiuser.save();

      }

      res.render("success",{id:req.params.id});
    }
    else {
      console.log(err);
    }
  })
});
function logoutall(){
  Authinstant.deleteMany({},function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      console.log("All logged Out");
    }
  });
};
logoutall();
app.post("/instant/logout/:id",function(req,res){
    req.logout();
  Authinstant.deleteMany({name:req.params.id},function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      res.redirect("/");
    }
  });
});
app.post("/instant/:id",function(req,res){
  res.redirect("/instant/"+req.params.id);
})
app.get("/previous/:id",function(req,res){
  Iuser.findOne({email:req.params.id},function(err,found){
    if(!err)
    {
      if(found)
      {
        res.render("previous",{name:found.name,address:found.address,undeli:found.order,id:req.params.id});
      }
      else {
        res.redirect("/noprevious/"+req.params.id);
      }
    }
    else{
      console.log(err);
    }
  });
});
app.get("/noprevious/:id",function(req,res){
  res.render("noprevious",{id:req.params.id});
});
app.get("/idelete/:id",function(req,res){

  var username=req.params.id;

  Instant.deleteOne({username:username},function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      console.log("success");
    }
  });
  Iuser.deleteOne({username:username},function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      res.redirect("/");
    }
  });

});










app.listen(3000,function(){
  console.log("server has started");
});
