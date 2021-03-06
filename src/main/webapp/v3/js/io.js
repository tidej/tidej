var io = {};

io.parseParams = function(s) {
    var parts = s.trim().split(';');  // Trim is important here!
	var result = {};
	for (var i = 0; i < parts.length; i++) {
		var part = parts[i];
		var cut = part.indexOf('=');
		if (cut != -1) {
			result[part.substr(0, cut)] = part.substr(cut + 1);
		}
	}
	return result;
}

io.loadContent = function(params, callback) {
  var path = "/storage?cache-poison=" + Math.random();
  for (var key in params) {
    var value = params[key];
    if (value != null) {
      path += "&" + key + "=" + encodeURIComponent(value);
    }
  }
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", path, true);
  xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4) {
	  var rawContent = xmlhttp.responseText;
	  var cut = rawContent.indexOf('\n');
	  var meta = io.parseParams(rawContent.substr(0, cut));
	  var content = rawContent.substr(cut + 1);
	  //console.log("raw:", rawContent, "content", content, "meta:", meta);
	  if (callback) {
	 	callback(content, meta);
	  }
    }
  };
  xmlhttp.send();
}


// Callback is called with the (potentially new) id and revision.
io.saveContent = function(content, params, callback) {
  var xmlhttp = new XMLHttpRequest();
  var path = "/storage";
  var separator = "?";
  for (var key in params) {
    var value = params[key];
    if (value != null) {
      path += separator + key + "=" + encodeURIComponent(value);
      separator = "&";
    }
  }
  var self = this;
  xmlhttp.open("POST", path, true);
  xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4) {
      if (callback != null) {
        var meta = io.parseParams(xmlhttp.responseText);
		callback(meta);
	  }
	}
  }
  xmlhttp.send(content);
}

