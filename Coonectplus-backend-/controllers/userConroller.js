const db = require('../config/db')
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
const USERS = require('../models/userModel').users
const POSTS = require('../models/userModel').posts
const VERIFY_EMAIL = require('../models/userModel').verifyEamil
const JOB_POST = require('../models/userModel').jobPost
const jwt = require("jsonwebtoken");
require("dotenv").config();
const multer = require('multer')
const path = require("path");
const moment= require('moment'); 
const nodemailer = require('nodemailer');
const { timeStamp } = require('console');
var objectId = require("mongodb").ObjectId;




const doSignup = (req, res) => {
    let userData = req.body;
console.log(userData);
    return new Promise(async (resolve, reject) => {
        try {


                let emailerr = await USERS.count({email: userData.email}) >0
                let moberr = await USERS.count({mobileNumber: userData.mobileNumber})>0 
                // console.log(emailerr,"*****************", moberr, "emailerr,moberr");
// let emailerr=false , moberr=false

                if (emailerr || moberr) {
                  
                    res.status(200).json({moberr, emailerr})

                } else {
                   
                    bcrypt.genSalt(10, (err, salt) => {

                        bcrypt.hash(userData.password, salt, async (err, hashedPassword) => {
                            if (err) {
                                console.log(`ERROR : ${err}`);
                            } else {
                                let password = hashedPassword;
                                await new USERS({
                                    userName: userData.userName,
                                    email: userData.email,
                                    mobileNumber: parseInt(userData.mobileNumber),
                                    password: password,
                                    timeStamp: new Date()
                                }).save().then((response) => {
                                    res.status(200).json({signup:true})
                                })
                            }
                        });
                    });
                }


            } catch {reject()}}
    )}

const doLogin = (req, res) => {
    let loginData = req.body

    return new Promise(async (resolve, reject) => {
        try {
            // console.log('reached at do login helpers ', loginData, USERS)
            let userData = await USERS.find({email: loginData.email})


            if (userData.length > 0) {

                const isMatch = await bcrypt.compare(loginData.password, userData[0].password)
                // console is match
                console.log(isMatch,"isMatch at controllers on login function")
                if (isMatch) {

                    const token = jwt.sign({
                     _id: userData._id
                    }, process.env.JWT_PRIVATEKEY, {expiresIn: "7d"})
                    console.log("success");

                    console.log("inside success");
                    userData.password=null
                    res.status(200).json({login: true, userData, token: token})


                } else {
                    res.json({login: false})
                }
            } else {
                console.log('else');
                res.json({login: false})
            }

        } catch (err) {
            console.log(err)
            reject(err)
        }
    })              

}

 const userBasicDetailsUpdate= async(req, res)=> {
  // console.log("log at user basic details update ",req.query,"88*************")
    try{
  
    const storage = multer.diskStorage({
      destination: path.join(__dirname, '../public',"resume"),
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' +file.originalname);
      },
    });

    const upload = multer({ storage: storage }).single('resume');

    upload(req, res, (err) => {

        if (!req.file) {
          USERS.findByIdAndUpdate({_id:req.query.userId},
            { $set: {userName:req.query.userName,
              keyrole:req.query.keyrole,
              currentCompanyName:req.query.currentCompanyName,
              currentDesignation:req.query.currentDesignation,
            
           
          
          
          }}, { upsert: true }).then((response)=>{          
            
                USERS.find({_id:req.query.userId}).then((response)=>{             
                    res.status(200).json(response)
                }).catch((err)=>{res.status(500).json({loadError:true,error:err})})
                           
            }).catch((err)=>{res.status(500).json({loadError:true,error:err})})


        } else {
         console.log(req.file.filename,"req.file.filenamereq.file.filenamereq.file.filename");
          USERS.findByIdAndUpdate({_id:req.query.userId},       
          { $set: {userName:req.query.userName,
                keyrole:req.query.keyrole,
                currentCompanyName:req.query.currentCompanyName,
                currentDesignation:req.query.currentDesignation,
                resume:req.file.filename
             
            
            
            }}, { upsert: true }).then((response)=>{
                USERS.find({_id:req.query.userId}).then((response)=>{
                    res.status(200).json(response)
                })
                .catch((err)=>{res.status(500).json({loadError:true,error:err})})
                                 
            }).catch((err)=>{res.status(500).json({loadError:true,error:err})})
   
    }
  })

   
}
catch(err){res.status(500).json({loadError:true,error:err})}
}
const changeProfileDp = (req,res)=>{
    const data = req.files

  try {         
    const storage = multer.diskStorage({
      destination: path.join(__dirname, '../public/images',"dp"),
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' +file.originalname);
      },
    });

    const upload = multer({ storage: storage }).single('dp');

    upload(req, res, (err) => {
      if (!req.file) {
        res.json({ noImage:true , message:'select an image' });
      } else {
        
        USERS.findByIdAndUpdate({_id:req.query.userId},{dp:req.file.filename})
          .then(async(response) => {
           const data =await USERS.find({_id:req.query.userId})
            res.status(200).json({upload:true,userData:data });
          })
          .catch((err) => {
            res.json({loadError:true, message:err});
          });
      }
    });
  } catch (error) {             
    console.log(error);
    res.json({loadError:true,message:"Some thing went wrong please try again "})
  }
};

  const userAboutSessionUpdate=(req,res)=>{
    try{
    // console.log('reached inside userAboutSessionUpdate',req.query);
    USERS.findByIdAndUpdate({_id:req.query.userId},{about:req.query.data},{upsert:true})
    .then(async(response)=>{
      const userdata= await USERS.find({_id:req.query.userId})
   
        res.status(200).json({upload:true,userData:userdata,message:"about content successfully done"})})
    .catch((error)=>{
        res.status(500).json({loadError:true,error:err})
    })
    }
    catch(error){
res.status(500).json({loadError:true,error:err})
    }
  }  

const userExperienceUpdate =(req,res)=>{
    try{
        USERS.findByIdAndUpdate({_id:req.query.userId},{experience:req.body},{upsert:true})
        .then(async(response)=>{
            const userdata= await USERS.find({_id:req.query.userId})
              res.status(200).json({upload:true,userData:userdata,message:"experinece content successfully done"})})
          .catch((error)=>{
              res.status(500).json({loadError:true,error:err})
          })

    }
    catch(error){
        console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
    }

}
const userSkillUpdate=(req,res)=>{
 try{
        USERS.findByIdAndUpdate({_id:req.query.userId},{skills:req.body},{upsert:true})
        .then(async(response)=>{
            const userdata= await USERS.find({_id:req.query.userId})
              res.status(200).json({upload:true,userData:userdata,message:"skills content successfully done"})})
          .catch((error)=>{
              res.status(500).json({loadError:true,error:err})
          })

    }
    catch(error){
        console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
    }

}

const addNewPost=(req,res)=>{
   
   
    try {         
      const storage = multer.diskStorage({
        destination: path.join(__dirname, '../public/posts',"files"),
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-' +file.originalname);
        },
      });
  
      const upload = multer({ storage: storage }).single('media');
  
      upload(req, res, (err) => {

            POSTS({
              postedBy:req.query.userId,
              postText:req?.query?.postText,
              mediaType:req?.query?.mediaType,
              file:req?.file?.filename,
              date:moment().format('LLLL'),
             timeStamp:new Date(),
            }).save()
            .then(async(response) => {
                    res.status(200).json({upload:true });
                  })
                  .catch((error) => {
                    console.log(error)
                    res.json({loadError:true, message:error});
                  });
              })
    } catch (error) {             
      console.log(error);
      res.json({loadError:true,message:"Some thing went wrong please try again "})
    }
  };
  const getCasualPostData=(req,res)=>{
    try{
    POSTS.find({}).populate("postedBy").sort({timeStamp:-1})
    .then((response)=>{
      res.status(200).json({dataFetched:true,data:response});})
    .catch((error) => {
      console.log(error)
      res.json({loadError:true, message:error});
    });
  }
  catch(error){
    console.log(error);
    res.json({loadError:true,message:"Some thing went wrong please try again "})
  }
  }

const updateLike =(req,res)=>{

// req.query will like this 
//   {
//     userId: '63690c00b7157f1186735aa7',
//     postId: '6376944df7012f1fdbf8cd1d'
//   }

try{



              POSTS.findOneAndUpdate(
                { _id: req.query.postId }, 
                { $push:{like: req.query.userId }},
                
            )
            .then(()=>{
              POSTS.findById(req.query.postId ).then((response)=>{
                res.status(200).json({update:true,singlePostData:response})
              }).catch((error)=>{
               
                res.json({loadError:true, message:error});
              })
          
        }).catch((error)=>{
        
          res.json({loadError:true, message:error}); 
              })
              
}
catch(error){
  console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
}

}

const updateUnLike=async (req,res)=>{
  // req.query will like this 
//   {
//     userId: '63690c00b7157f1186735aa7',
//     postId: '6376944df7012f1fdbf8cd1d'
//   }
try{

 POSTS.findOneAndUpdate({ _id:req.query.postId}, { $pull: { like:  req.query.userId  }}, {multi:true },(err)=>{console.log(err)}).clone()
 .then(()=>{
  POSTS.findById(req.query.postId ).clone().then((response)=>{
    res.status(200).json({update:true,singlePostData:response})
  }).catch((error)=>{
   
    res.json({loadError:true, message:error});
  })

}).catch((error)=>{

res.json({loadError:true, message:error}); 
  })


}
catch(error){
  console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
}
}

const addNewComment = async(req,res)=>{
  try{
// console.log("reached at addNewComment backend ",req.query)  
const commentData={
  commentedBy:req?.query?.userId,
  commentText:req?.query?.commentText,
  timeStamp:new Date(),
  dp: req?.query?.dp ,
  userName: req?.query?.userName ,
  keyrole:req?.query?.keyrole
}      
  
await POSTS.findByIdAndUpdate(req.query.postId, { $addToSet: { comment: commentData  }},{new:true},(err)=>{console.log(err)}).clone()


  POSTS.findById(req.query.postId ).sort({timeStamp:1}).clone().then((response)=>{
    res.status(200).json({upload:true,singlePostData:response})
  }).catch((error)=>{
         console.log(error)  
    res.json({loadError:true, message:error+"1"});
  })


          
}
catch(err){
  console.log(err);
  res.json({loadError:true,message:"Some thing went wrong please try again "})
}

}
  
const getResume=(req,res)=>{
  console.log(req.query,"ath gert resum,e ");
  try{
    const filePath = "public/resume/" + req.query.data;
    console.log(filePath)                           
 res.download(filePath,"Resume",(err)=>{
  console.log(err);
 })
  }
  catch(err){
    console.log(err);
  }        

}
const verifyEmail= async (req,res)=>{

  try{
  const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
       auth: {
            user: 'connectplus.hire@gmail.com',
            pass: 'xfkyimziiixneypb',
         },
    secure: true,
    });

    let verificationCode = Math.floor(1000 + Math.random() * 9000).toString()
console.log(verificationCode,"verificationCode");
await VERIFY_EMAIL({email:req.query.email,
        verificationCode:verificationCode
                    }).save()
    const mailData = {
      from: 'connectplus.hire@gmail.com',  // sender address
        to: req.query.email,   // list of receivers
        subject: 'Verifiaction Code ',
        text: 'your  verification code  is : '+verificationCode +
        ' please note code will expire in 5 minitues '
      
      };

      transporter.sendMail(mailData, function (err, info) {
        if(err)
          console.log(err)
        else
          res.status(200).json({codeGenerated:true})
     });
     console.log("rexhed at her 4344")
    }
    catch(err){
      res.status(404).json({loadError:true,message:err})
    }
}
const checkVerificationCode=(req,res)=>{
  try{
  console.log(req.query,"checkVerificationCode");
  VERIFY_EMAIL.find({email:req.query.email,verificationCode:req.query.verificationCode}).then((response)=>{
    console.log(response);
    if(response.length>0)
    {
      res.status(200).json({verified:true})
    }
    else{
      res.status(200).json({verified:false,message:"Inavalid code"})
    }
  })
}
catch(err){
  res.status(404).json({loadError:true,message:err})
}

}
const verificationCodeforForgotPassword= async(req,res)=>{
console.log(req.query);
try{
let userCheck=await USERS.count({email:req.query.email})>0
console.log(userCheck);
if(!userCheck ){

  res.status(200).json({noEmail:true})
  return
}
  const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
       auth: {
            user: 'connectplus.hire@gmail.com',
            pass: process.env.NODEMAILER_KEY,
         },
    secure: true,         
    });

    let verificationCode = Math.floor(1000 + Math.random() * 9000).toString()
await VERIFY_EMAIL({email:req.query.email,
        verificationCode:verificationCode
                    }).save()
    const mailData = {               
      from: 'connectplus.hire@gmail.com',  // sender address
        to: req.query.email,   // list of receivers
        subject: 'Verifiaction Code ',
        text: 'your  verification code  is : '+verificationCode +
        ' please note that the  code will expires in 5 minitues '
      
      };

      transporter.sendMail(mailData, function (err, info) {
        if(err)
          console.log(err)
        else
       { 
          res.status(200).json({codeGenerated:true})}
     });

    }
    catch(err){
      console.log(err)
      res.status(404).json({loadError:true,message:err})
    }
}
const changePassword=(req,res)=>{
try{
  // { email: 'kelvinpktl@gmail.com', newPassword: 'kelvinpktl@gmail.com' }
  console.log(req.body);
  bcrypt.genSalt(10, (err, salt) => {

    bcrypt.hash(req.body.newPassword, salt, async (err, hashedPassword) => {
        if (err) {
            console.log(`ERROR : ${err}`);
        } else {
            let password = hashedPassword;
            USERS.findOneAndUpdate({email:req.body.email},{password: password,
               }).then((response) => {
              console.log(response);
                res.status(200).json({passwordUpdate:true})
            })
            .catch((error)=>{
              console.log(error)  
         res.json({loadError:true, message:error});
       
           })
        }
    });
}) }
catch(err){
  res.status(404).json({loadError:true,message:err})
}
}

const addNewJobPost=(req,res)=>{
  try{
    const storage = multer.diskStorage({
      destination: path.join(__dirname, '../public/JobPosts',"CompanyLogo"),
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' +file.originalname);
      },
    });

    const upload = multer({ storage: storage }).single('image');

    upload(req, res, (err) => {

JOB_POST({
  companyName: req?.query?.companyName ,
  designation:req?.query?. designation ,
  workLocation : req?.query?.workLocation ,
  workType :req?.query?.workType ,
  workMode:req?.query?.workMode ,
  minSalary :req?.query?. minSalary ,
  maxSalary:req?.query?. maxSalary  ,
  overView :req?.query?. overView  ,
  jd:req.query?. jd ,
  authorisationReq:req?.query?.authorisationReq,
  userId:req?.query?.userId,
  companyLogo:req?.file?.filename, 
  timeStamp:new Date(),    

}).save()
.then((response)=>{
  res.status(200).json({upload:true})
}).catch((error)=>{
       console.log(error)  
  res.json({loadError:true, message:error+"1"});

    })
  })
  }catch (error) {             
      console.log(error);
      res.json({loadError:true,message:"Some thing went wrong please try again "})
    }

}

const jobPostData =(req,res)=>{
console.log("reacched inside jon=bpost daat a")
try{
JOB_POST.find({}).sort({timeStamp:1})
.then((response)=>{
  res.status(200).json({dataFetched:true,data:response});})
.catch((error) => {
  console.log(error)
  res.json({loadError:true, message:error});
});
}
catch(error){
console.log(error);
res.json({loadError:true,message:"Some thing went wrong please try again "})
}

}
const ownJobPostData =(req,res)=>{
  try{
  console.log(req.body,req.query ,"reqched inside ownjob dataa ");
  JOB_POST.find({userId:req.query.userId}).sort({timeStamp:-1})
  .then((response)=>{
    console.log(response)
    res.status(200).json({dataFetched:true,data:response});})
  .catch((error) => {
    console.log(error)
    res.json({loadError:true, message:error});
  });
}
catch(error){
  console.log(error);
  res.json({loadError:true,message:"Some thing went wrong please try again "})
}
}

const deleteTheJobPost=(req,res)=>{
console.log(req.query);
  try{
JOB_POST.findOneAndDelete({_id:req.query.postId})
.then((response)=>{
  console.log(response)
  res.status(200).json({removePost:true});})
.catch((error) => {
  console.log(error)
  res.json({loadError:true, message:error});
});
  }
  catch(error){
    console.log(error);
    res.json({loadError:true,message:"Some thing went wrong please try again "})
  }
}


const updateSingleJobPostData=(req,res)=>{
  console.log(req.query,"req.query t updaTE JOB POST ")
try{
  if(req.query.logoChange==="true"){
    const storage = multer.diskStorage({
      destination: path.join(__dirname, '../public/JobPosts',"CompanyLogo"),
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' +file.originalname);
      },
    });

    const upload = multer({ storage: storage }).single('image');

    upload(req, res, (err) => {
      JOB_POST.findByIdAndUpdate({_id: req.query.postId},{$set:{
        companyName: req?.query?.companyName ,
        designation:req?.query?. designation ,
        workLocation : req?.query?.workLocation ,
        workType :req?.query?.workType ,
        workMode:req?.query?.workMode ,
        minSalary :req?.query?. minSalary ,
        maxSalary:req?.query?. maxSalary  ,
        overView :req?.query?. overView  ,
        jd:req.query?. jd ,
        authorisationReq:req?.query?.authorisationReq,
        userId:req?.query?.userId,
        companyLogo:req?.file?.filename,

      }})
      .then((response)=>{
        console.log(response);
        res.status(200).json({update:true})
      }).catch((error)=>{
             console.log(error)  
        res.json({loadError:true, message:error+"1"});
      
          })
      
  })
  }
  else{

    JOB_POST.findByIdAndUpdate({_id: req.query.postId},{$set:{
      companyName: req?.query?.companyName ,
      designation:req?.query?. designation ,
      workLocation : req?.query?.workLocation ,
      workType :req?.query?.workType ,
      workMode:req?.query?.workMode ,
      minSalary :req?.query?. minSalary ,
      maxSalary:req?.query?. maxSalary  ,
      overView :req?.query?. overView  ,
      jd:req.query?. jd ,
      authorisationReq:req?.query?.authorisationReq,
      userId:req?.query?.userId,
   

    }})
    .then((response)=>{
      console.log(response);
      res.status(200).json({update:true})
    }).catch((error)=>{
           console.log(error)  
      res.json({loadError:true, message:error+"1"});
    
        })
  }


}
catch(error){
  console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
}
}
const getDataForDetailedJobPostView=(req,res)=>{

  // data in query 
  //{ postId: '6381bbed892f79e489bd8f93' }

  try{
  JOB_POST.findById(req.query.postId)
  .then((response)=>{
    res.status(200).json({dataFetched:true, response})
  }).catch((error)=>{
         console.log(error)  
    res.json({loadError:true, message:error});
  
      })
}
catch(error){
  console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
}

}
const applyForAJob= async (req,res )=>{

// data passed
// {
//   userId: '63690c00b7157f1186735aa7',
//   jobPostId: '6381c4e1892f79e489bd8fb1'
// } 
try{
  const jobApplication={
    userId:req.body.userId,
    timeStamp:(new Date()).setSeconds(0)
  }
  JOB_POST.updateOne({_id:req.body.jobPostId},{$addToSet:{appliedCandidates:jobApplication}},{new:true},(err)=>{console.log(err)}).clone()
  .then((response)=>{
    res.status(200).json({jobApply:true})
  }).catch((error)=>{
         console.log(error)  
    res.json({loadError:true, message:error});
  
      })

}
catch(error){
  console.log(error);
        res.json({loadError:true,message:"Some thing went wrong please try again "})
}

}
const getCandidateDataOfJobApplied=(req,res)=>{

  // sample data input
  // { postId: '638103cacde597280f1806f8' } 
  try{
JOB_POST.findById(req.query.postId)
.populate({
  path: 'appliedCandidates',
  populate: {
      path: 'userId' 
  },
})
.then((response)=>{
  res.status(200).json({dataFetched:true,response})
}).catch((error)=>{
       console.log(error)  
  res.json({loadError:true, message:error});

    })

  }
  catch(error){
    console.log(error);
          res.json({loadError:true,message:"Some thing went wrong please try again "})
  }
}
const getUserData=(req,res)=>{
  try{

  USERS.find({_id:req.body.userId},'-password')
  .then((response)=>{
    res.status(200).json({dataFetched:true,response})
  }).catch((error)=>{
         console.log(error)  
    res.json({loadError:true, message:error});
  
      })
  
    }
    catch(error){
      console.log(error);
            res.json({loadError:true,message:"Some thing went wrong please try again "})
    }
  }
const getConnectionSuggestionData=(req,res)=>{
try{              
console.log(req.query,"rehewd inside get userss data ")

USERS.aggregate([
{
  $match:{_id: objectId(req.query?.userId)}
},
{
  $project:{ conectionReq:'$connectionReq.userId',connections:"$connections.userId",_id:0,connectionReqSend:"$connectionReqSend.userId"}
},
{
  $project:{selectedId:{ $concatArrays: [ "$conectionReq", "$connections","$connectionReqSend",[ objectId(req.query.userId)] ] }}
}


])

.then(async (response)=>{
  console.log(response,"reponse after aggragrate in con siugg datta");
availableUser=[... new Set(response[0].selectedId)]   // here deleting duplivcate elements 

USERS.find({_id:{$nin:availableUser}},"_id userName currentDesignation keyrole dp ").clone() 
.then((response)=>{
  res.status(200).json({dataFetched:true,response})
}).catch((error)=>{
       console.log(error)  
  res.json({loadError:true, message:error});

    })             
})

}
catch(error){
  console.log(error);
       res.json({loadError:true,message:"Some thing went wrong please try again "})
}
}

const getConnectionRequestData =(req,res)=>{
///  console.log(req.query,"inside an connection req data ");
try{
USERS.find({_id:req.query.userId},'').populate({
  path:'connectionReq',
  populate:{
    path:'userId',
    select:[ '_id', 'userName','currentDesignation','keyrole' ,'dp '],
  }
} )
.then((response)=>{
  console.log("inside  get connection reeq data ",response[0].connectionReq);
  res.status(200).json({dataFetched:true,data:response[0].connectionReq})
}).catch((error)=>{
       console.log(error)  
  res.json({loadError:true, message:error});

    })      
  }
  catch(error){
    console.log(error);
         res.json({loadError:true,message:"Some thing went wrong please try again "})
  }


}

const sendConnectionReq = (req,res)=>{
  console.log(req.body);
try{

  USERS.findOneAndUpdate({_id:req.body.reqUserId},{$push:{connectionReq:{userId:req.body.userId}}},{new:true}).then((response)=>{     // this fn to store request in other user 
  

  USERS.findOneAndUpdate({_id:req.body.userId},{$push:{connectionReqSend:{userId:req.body.reqUserId}}},{new:true})   .then((response)=>{
    console.log(response);
    res.status(200).json({update:true})
  }).catch((error)=>{
         console.log(error)  
    res.json({loadError:true, message:error+"1"});
  
      })
  
  // this is to store sent connection reqs on requewst sender database 
 })
}
catch(error){
  console.log(error);
       res.json({loadError:true,message:"Some thing went wrong please try again "})
}
}
const acceptConnectionReq=(req,res)=>{
// incomming req.bdy conatains 
//                       {
//                         userId: '638824cc739403a46874f5d2',
//                         reqUser: '6388261a739403a46874f5fd'
//                       }
                    
                    
try{

  USERS.findOneAndUpdate({_id:req.body.userId},{$push:{connections:{userId:req.body.reqUser}},$pull:{connectionReq:{userId:req.body.reqUser}}},{new:true}) // to update connection list of current user
  USERS.findOneAndUpdate({_id:req.body.reqUser},{$push:{connections:{userId:req.body.userId}},$pull:{connectionReq:{userId:req.body.userId}}},{new:true}) // to update id on req sent user connection  array  
  .then((response)=>{
    console.log(response,"respnse after updatinf the dataa ********************2");
    res.status(200).json({update:true})
  }).catch((error)=>{
         console.log(error)  
    res.json({loadError:true, message:error+"1"});
  
      })            

}
catch(error){
  console.log(error);
       res.json({loadError:true,message:"Some thing went wrong please try again "})

}
}

const declineConnectionReq=async (req,res)=>{
// incomming req.bdy conatains 
                    //  {
                    //    userId: '6388261a739403a46874f5fd',
                    //    reqUser: '638824cc739403a46874f5d2'
                    //  }
  try{

await USERS.findOneAndUpdate({_id:req.body.userId},{$pull:{connectionReq:{userId:req.body.reqUser}}},{new:true})
USERS.findOneAndUpdate({_id:req.body.reqUser},{$pull:{connectionReqSend:{userId:req.body.userId}}})
.then((response)=>{
  res.status(200).json({update:true})
}).catch((error)=>{
       console.log(error)  
  res.json({loadError:true, message:error+"1"});

    }) 
  }catch(error){
  console.log(error);
       res.json({loadError:true,message:"Some thing went wrong please try again "})

}
}

module.exports = {
    doSignup,
    doLogin,
    userBasicDetailsUpdate,
    changeProfileDp,
    userAboutSessionUpdate,
    userExperienceUpdate,
    userSkillUpdate,
    addNewPost,
    getCasualPostData,
    updateLike,
    updateUnLike,
    addNewComment,
    getResume,
    verifyEmail,
    checkVerificationCode,
    verificationCodeforForgotPassword,
    changePassword,
    addNewJobPost,
    jobPostData,
    ownJobPostData,
    deleteTheJobPost,
    updateSingleJobPostData,
    getDataForDetailedJobPostView,
    applyForAJob,
    getCandidateDataOfJobApplied,
    getUserData,
    getConnectionSuggestionData,
    getConnectionRequestData,
    sendConnectionReq,
    acceptConnectionReq,
    declineConnectionReq,
    






}
