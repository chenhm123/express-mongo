var express = require('express');
var crypto = require('crypto'),
    Post = require('../models/post.js'),
	Comment = require('../models/comment.js'),
	User = require('../models/user.js');

module.exports = function(app){
	var getReq = [
		{
			url:'/',
			page:'index',
			callback:function(req,res){
				var page = req.query.p ? parseInt(req.query.p) :1;
                Post.getTen(null,page,function(err,posts,total){
                    if(err){
                        posts = [];
                    }
                    res.render('index',{
                        title:'post page',
                        user:req.session.user,
                        posts:posts,
						page:page,
						isFirstPage:(page-1)==0,
						isLastPage:((page-1)*10+posts.length)==total,
                        success:req.flash('success').toString(),
                        error:req.flash('error').toString()
                    })
                })
			}
		},
        {
          url:'/reg',
          callback:checkNotLogin
        },
		{
			url:'/reg',
			page:'reg',
			callback:function(req,res){
				res.render('reg',{
					title:'reg page',
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				})
			}
		},
		{
			url:'/login',
			callback:checkNotLogin
		},
		{
			url:'/login',
			page:'login',
			callback:function(req,res){
                res.render('login', {
                    title: '登录',
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()});
			}
		},
        {
            url:'/post',
            callback:checkLogin
        },
		{
			url:'/post',
			page:'post',
			callback:function(req,res){
                res.render('post', {
                    title: '发表',
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
			}
		},
		{
			url:'/logout',
			page:'',
			callback:function(req,res){
                req.session.user = null;
                req.flash('success', '登出成功!');
                res.redirect('/');//登出成功后跳转到主页
			}
		},
		{
			url:'/upload',
			callback:checkLogin
		},
		{
			url:'/upload',
			callback:function(req,res){
				res.render('upload',{
					title:"上传文件",
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				})
			}
		},
		{
			url:'/u/:name',
			callback:function(req,res){
				var page = req.query.p?parseInt(req.query.p):1;
				User.get(req.params.name,function(err,user){
					if(!user){
						req.flash('error','user is not exist');
						return res.redirect('/')
					}
					Post.getTen(user.name,page,function(err,posts,total){
						if(err){
							req.flash('error',err);
							return res.redirect('/')
						}
						res.render('user',{
							title:user.name,
							posts:posts,
							user:req.session.user,
							page: page,
							isFirstPage: (page - 1) == 0,
							isLastPage: ((page - 1) * 10 + posts.length) == total,
							success:req.flash('success').toString(),
							error:req.flash('error').toString()
						})
					})
				})
			}
		},
		{
			url:'/p/:_id',
			callback:function(req,res){
				Post.getOne(req.params._id,function(err,post){
					if(err){
						req.flash('error','err');
						return res.redirect('/')
					}
					res.render('article',{
						title:req.params.title,
						post:post,
						user:req.session.user,
						success:req.flash('success').toString(),
						error:req.flash('error').toString()
					})
				})
			}
		},
		{
			url:'/edit/:name/:day/:title',
			callback:checkLogin
		},{
			url:'/edit/:name/:day/:title',
			callback:function(req,res){
				var currentUser = req.session.user;
				Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
					if(err){
						req.flash('error',err);
						return res.redirect('back')
					}
					res.render('edit',{
						title:'edit',
						post:post,
						user:req.session.user,
						success:req.flash('success').toString(),
						error:req.flash('error').toString()
					})
				})
			}
		},
		{
			url:'/remove/:name/:day/:title',
			callback:checkLogin
		},
		{
			url:'/remove/:name/:day/:title',
			callback:function(req,res){
				var currentUser = req.session.user;
				Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
					if(err){
						req.flash('error',err);
						return res.redirect('/')
					}
					req.flash('success','success');
					res.redirect('/')
				})
			}
		},
		{
			url:'/archive',
			callback:function(req,res){
				Post.getArchive(function(err,posts){
					if(err){
						req.flash('error',err);
						return res.redirect('/');
					}
					res.render('archive',{
						title:'archive',
						posts:posts,
						user:req.session.user,
						success:req.flash('success').toString(),
						error:req.flash('error').toString()
					})
				})
			}
		},
		{
			url:'/tags/:tag',
			callback:function(req,res){
				Post.getTag(req.params.tag, function (err, posts) {
					if (err) {
						req.flash('error',err);
						return res.redirect('/');
					}
					res.render('tag', {
						title: 'TAG:' + req.params.tag,
						posts: posts,
						user: req.session.user,
						success: req.flash('success').toString(),
						error: req.flash('error').toString()
					});
				});
			}
		},
		{
			url:'/tags',
			callback:function(req,res){
				Post.getTags(function(err,docs){
					if(err){
						req.flash('error',err);
						return res.redirect('back')
					}
					res.render('tags',{
						'title':'tags',
						'user':req.session.user,
						'posts':docs,
						'success':req.flash('success').toString(),
						'error':req.flash('error').toString()
					})
				})
			}
		},
		{
			url:'/search',
			callback:function(req,res){
				Post.search(req.query.keyword,function(err,docs){
					if(err){
						req.flash('error',err);
						return res.redirect('/');
					}
					res.render('search',{
						title:"Search:"+req.query.keyword,
						posts:docs,
						user:req.session.user,
						success:req.flash('success').toString(),
						error:req.flash('error').toString()
					})
				})
			}
		},
		{
			url:'/links',
			callback:function(req,res){
				res.render('links',{
					title:'友情链接',
					user:req.session.user
				})
			}
		},
		{
			url:'/reprint/:name/:day/:title',
			callback:checkLogin
		},
		{
			url:'/reprint/:name/:day/:title',
			callback:function(req,res){
				Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
					if(err){
						req.flash('error',err);
						return res.redirect('back');
					}
					var currentUser = req.session.user,
						reprint_from = {name:post.name,day:post.time.day,title:post.title},
						reprint_to = {name:currentUser.name,head:currentUser.head};
					Post.reprint(reprint_from,reprint_to,function(err,post){
						if(err){
							req.flash('error',err);
							return res.redirect('back');
						}
						req.flash('success',"success");
						var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
						//跳转到转载后的文章页面
						res.redirect(url);
					})
				})
			}
		}
	]
	var postReq = [
		{
			url:'/upload',
			callback:checkLogin
		},
		{
			url:'/upload',
			callback:function(req,res){
				req.flash('success','上传成功');
				res.redirect('/upload');
			}
		},
        {
            url:'/reg',
            callback:checkNotLogin
        },
		{
			url:'/reg',
			callback:function(req,res){
				var name = req.body.name,
					password = req.body.password,
					password_re = req.body['password-repeat'];
				if(password_re !== password){
					req.flash('error','Entered passwords differ');
					return res.redirect('/reg');
				}
				var md5 = crypto.createHash('md5'),
					password = md5.update(req.body.password).digest('hex');
				var newUser = new User({
					name:name,
					password:password,
					email:req.body.email
				})
				User.get(newUser.name,function(err,user){
					if(err){
						req.flash('error',err);
						return res.redirect('/');
					}
					if(user){
						req.flash('error','user already exist')
						return res.redirect('/reg');
					}
					newUser.save(function(err,user){
						if(err){
							req.flash('error',err);
							return res.redirect('/reg');
						}
						req.session.user = user;
						req.flash('success','success');
						res.redirect('/')
					})
				})

			}
		},
        {
            url:'/login',
            callback:checkNotLogin
        },
		{
			url:'/login',
			callback:function(req,res){
				var md5 = crypto.createHash('md5'),
					password = md5.update(req.body.password).digest('hex');
				User.get(req.body.name,function(err,user){
					if(!user){
						req.flash('error','User does not exist ')
						return res.redirect('/login')
					}
					if(user.password !== password){
						req.flash('error','password is not right')
						return res.redirect('/login')
					}
					req.session.user = user;
					req.flash('success','success');
					res.redirect('/');
				})
			}
		},
        {
            url:'/post',
            callback:checkLogin
        },
		{
			url:'/post',
			callback:function(req,res){
                var currentUser = req.session.user,
					tags = [req.body.tag1,req.body.tag2,req.body.tag3],
                    post = new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
                post.save(function(err){
                    if(err){
                        req.flash('error',err);
                        return res.redirect('/')
                    }
                    req.flash('success','发布成功')
                    res.redirect('/')
                })
            }
		},
		{
			url:'/edit/:name/:day/:title',
			callback:checkLogin
		},
		{
			url:'/edit/:name/:day/:title',
			callback:function(req,res){
				Post.update(req.params.name,req.params.day,req.params.title,req.body.post,function(err){
					var url = encodeURI('/u/'+req.params.name+'/'+req.params.day+"/"+req.params.title);
					if(err){
						req.flash('error',err);
						return res.redirect(url);
					}
					req.flash('success','success');
					res.redirect(url);
				})
			}
		},
		{
			url:'/u/:name/:day/:title',
			callback:function(req,res){
				var date = new Date(),
					time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
						date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
				var md5 = crypto.createHash('md5'),
					email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
					head = "http://www.gravatar.com/avator/"+email_MD5+"?s=48";

				var comment = {
					name:req.body.name,
					email:req.body.email,
					website:req.body.website,
					time:time,
					content:req.body.content,
					head:head
				}
				var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
				newComment.save(function(err){
					if(err){
						req.flash('error',err);
						console.log(err);
						return res.redirect('back')
					}
					req.flash('success','success');
					return res.redirect('back');
				})
			}
		}
	]

	getReq.forEach(function(option){
		app.get(option.url,option.callback)
	})
	postReq.forEach(function(option){
		app.post(option.url,option.callback)
	})
	app.use(function(req,res){
		res.render("404");
	})

}
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录!');
        res.redirect('/login')
    }else{
		next();
	}
}
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录！')
        res.redirect('back');
    }else{
		next()
	}
}