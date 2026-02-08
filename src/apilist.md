<!-- @format -->

# Devtinder

authRouter

- Post /signup
- Post /login
- Post /logout

profileRouter

- Get /profile/view
- Patch /profile/edit
- Patch /profile/password

connectionsRequestRouter

- Post /request/send/:status/:userId
- Post /request/review/:status/:requestId

userRouter

- Get /connections
- Get /requests
- Get /feed
