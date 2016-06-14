var mongodb = require('./db');

function Comment(name,day,title,content){
    this.name = name;
    this.day = day;
    this.title = title;
    this.content = content;
}

module.exports = Comment;

Comment.prototype.save = function(callback){
    var name = this.name,
        day = this.day,
        title = this.title,
        content = this.content;

    mongodb.open(function(err,db){
        if(err){
            return callback(db);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "time.day":day,
                "title":title
            },{
                $push: {'comments':content}
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null)
            })
        })
    })
}