Back End application for bin.od Url shortnener using ExpressJs 

API list

post /signUp
//Sign Up and user account generation
{name, email, password}
success: 200 user created successfully
fail: account already exists, invalid credentials

post /signIn -
//Sign In and Token Generation
{email, passsword}
success: AT & RT(in coookie)
fail: invalid cred, account does not exist, invalid cred (creds dont match records)

post /forgotMyPassword
//Forgot password and email verification
{email}
success: email sent 
fail: invalid cred, acc does not exist, internal server error

post /forgotMyPassword-auth
//Verify email and reset password
{query(rs and e)}
success: redirect to front End Create New Password page
fail: invalid cred,
redirect to frontEnd/errorPage?status=Sorry, this link does not exist,
redirect to frontEnd/errorPage?status=Sorry, this link has already been used

post /createNewPassword
//Submit new password
{email,randomString, newPassword}
success: 200 password changed successfully
fail: invalid cred(rs or email or pwd), 
sorry session expired,
sorry link already used

post /getNewTokens -
//Token Regeneration
{cookies:refreshToken}
success: AT & RT(in cookie)
fail: 
RT not verified Unauthorized (redirect to sign In page)

delete /logout
//Logout & Token Deletion
{cookies:RT}
success: clearCookie+delete RT from DB & 204 logged out successfully
fail: RT expired or invalid Unauthorized

post /dashboard -
//Load the Dashboard
{AT in header}
success: 200 data and userName
fail: Unauthorized no AT in header,
Unauthorized invalid AT,
"jwt expired" expired AT

post /binodit -
//Generate short Url and push record in DB
{AT in header}
success: 200
fail: Unauthorized no AT in header,
Unauthorized invalid AT,
"jwt expired" expired AT,
invalid link
Conflict short link already created
Bad Request URL doesnt exist

get /:short
/Redirect to Long Url through Short URL
{req.params.short}
success: redirect to long Url
failure: redirect to Invalid Short Url

post /getRecords -
{AT in header}
success: 200 data
fail: Unauthorized no AT in header,
Unauthorized invalid AT,
"jwt expired" expired AT,
