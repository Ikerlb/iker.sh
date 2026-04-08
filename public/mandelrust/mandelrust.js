const request = (method, url, data) => {
		return new Promise(
			function(resolve, reject) 
			{
				var http = new XMLHttpRequest();
				http.open(method, url);
				http.onload= function(){
					if(this.status >= 200 && this.status < 300)
					{
						var response = http.response;
						try
						{
							resolve(http.response);
						}
						catch (error)
						{
							reject({
								status: this.status,
								statusText: error
							});
						}
						
					}
					else
					{
						reject({
							status: this.status,
							statusText: http.statusText
						});
					}
				};
				http.onerror = function(){
					reject({
						status: this.status,
						statusText: http.statusText
					});
				};
				
        // for this purpuse, all post requests
        // will be handled with json 
				if(method === 'POST')
				{
					data = data || {};
					http.send(JSON.stringify(data));
				}
				else http.send();
			}
  );
}


const callMandelbrot = (zoom) => {
  const url = "https://7el4n2j6wexvmsas7rrewvxwxu0fimju.lambda-url.us-east-1.on.aws/"; 
  var win = window,
    doc = document,
    docElem = doc.documentElement,
    body = doc.getElementsByTagName('body')[0],
    x = win.innerWidth || docElem.clientWidth || body.clientWidth,
    y = win.innerHeight|| docElem.clientHeight|| body.clientHeight;

  const d = {
    "zoom_level": zoom,
    "width": x,
    "height": y, 
  }

  console.log(d);

  request("POST", url, d).then(r => {
    console.log("yeahhh terminated correctly");
    let spinner = document.getElementById("spinner-container");
    spinner.parentNode.removeChild(spinner);
    let htmlImg = document.createElement("img");
    htmlImg.src = `data:image/png;base64,${r}`; 
    htmlImg.style["width"] =  "100%";
    htmlImg.style["height"] =  "100%";
    let container = document.getElementById("container");
    container.appendChild(htmlImg);
  }).catch(e => {
    alert("ha ocurrido un error. intentalo más tarde " + JSON.stringify(e));
  })
}

const getRandomInt = (min, max)  => {
  return Math.floor(Math.random() * (max - min)) + min;
}

callMandelbrot(getRandomInt(1, 10000));
