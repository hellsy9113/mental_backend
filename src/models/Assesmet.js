const mongoose=require ("mongoose")

const AssessmentSchema=new mongoose.Schema(
{
   userId:{
     type: mongoose.Schema.Types.ObjectId,
     ref:'User',
     required:true,
     index:true,
   },
   answers:[
    {
    questionId:{
        type:Number,
        required:true,
    },
    answer:{
        type:Number,
        required:true
    }
    }
   ],
   score:{
    type:Number,
    default:0
   },
   severity:{
    type:String,
    enum:['low','medium','high'],
    default:'low',
   },

    
},
{timestamps:true}
);


module.exports=mongoose.model('Assessment',AssessmentSchema)