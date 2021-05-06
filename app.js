const express = require("express")
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine','ejs');

mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
   username : String,
   name:String,
   password : String,
   role : String,
   college : String,
   batch : String,
   proficiency : [String],
   about: String
})

const querySchema = new mongoose.Schema({
   query:String,
   askedBy:String,
   answers : Array
})

const User  =  mongoose.model('User',userSchema);
const Query = mongoose.model('Query',querySchema);

let loggedInUser = "";

app.get('/',(req,res)=>{
   res.render('register');
})

app.post('/register',(req,res)=>{
   console.log(req.body);
   if(req.body.pwd===req.body.re_pwd){
      User.findOne({username : req.body.email},(err,foundItem)=>{
         if(err){
            console.log(err);
         }
         else{
            if(!foundItem){
               const user = new User({
                  username : req.body.email,
                  password : req.body.pwd,
                  role : req.body.role
               })
         
               user.save((err)=>{
                  if(err){
                     console.log(err);
                  }
                  loggedInUser = user.username;
                  console.log("user saved successfully",loggedInUser);
                  if(req.body.role==="Alumni")
                     res.redirect("/about");
                  else  
                     res.redirect("/home")   
               })
            }
            else{
               console.log(foundItem);
            }
         }
      })
   }
   else{
      console.log("password did not match");
   }
})

app.post('/login',(req,res)=>{
   console.log(req.body);
   User.findOne({username:req.body.email},(err,foundItem)=>{
      if(err)
         console.log(err);
      else{
         console.log(foundItem);
         if(foundItem){
            if(foundItem.password===req.body.pwd){
               loggedInUser = foundItem.username;
               console.log("user saved successfully",loggedInUser);
               res.redirect('/home');
            }
            else{
               console.log("password did not match");
            }
         }
         else{
            console.log("No item found");
         }
      }
   })
})

app.get('/about',(req,res)=>{
   res.render('alumniabout');
})

app.post('/fillabout',(req,res)=>{
   console.log("email :",loggedInUser);
   console.log(req.body);
   let batchStudied = req.body.start + '-' + req.body.end;
   User.updateOne({username:loggedInUser}, 
      {$set : {name:req.body.name,
               college:req.body.college, 
               proficiency : req.body.proficiency, 
               batch:batchStudied,
               about:req.body.about}
      },(err)=>{
         if(err)
         console.log(err);
      console.log("updated!");   
      res.redirect('/home');
   })
})

app.get('/home',(req,res)=>{
   res.render('home', {loggedInUser:loggedInUser});
})

app.get('/alumni',(req,res)=>{
   User.find({role:"Alumni"},(err,foundItems)=>{
      if(err){
         console.log(err);
      }      
      else{
         if(foundItems){
            res.render('alumni',{alumni:foundItems});
         }
      }
   })
})

app.get('/query',(req,res)=>{
   console.log(loggedInUser);
   Query.find({},(err,foundItem)=>{
      if(err){
         console.log(err);
      }
      else{
         res.render('queries',{user:loggedInUser,query:foundItem});
      }
   })
})

app.post("/individual-query",(req,res)=>{
      console.log(req.body);
      Query.findOne({_id:req.body.query_id},(err,foundItem)=>{
         if(err)
            console.log(err);
         else{
            res.render('individual-query',{query:foundItem});
         }   
      })
})

app.post('/add-answer',(req,res)=>{
   console.log(req.body);
   Query.updateOne(
      { _id: req.body.query_id },
      { $push: { answers: req.body.answer } },
      (err) => {
         if(err)
            console.log(err);
         res.redirect('query');   
      }
   )
})

app.post('/ask',(req,res)=>{
   console.log(req.body);
   const query = new Query({
      query:req.body.query,
      askedBy : req.body.user
   })

   query.save(err=>{
      if(err)
         console.log(err);
      console.log("query submitted");
      res.redirect('/query');
   })
})

app.get('/logout',(req,res)=>{
   loggedInUser="";
   res.redirect('/');
})

 app.listen(3000,()=>{
    console.log("server started on port 3000");
 })