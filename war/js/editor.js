tidej.Editor = function() {
    this.currentClass = null;
    this.currentProperty = null;
    this.currentMethod = null;
    this.revision = -1;
    this.saveTimer = -1;
    this.initUi();
    this.lastSaved = null;
    this.id = -1;
}

tidej.Editor.prototype.addClass = function () {
    var newClass = $("#templates tj-class").get(0).cloneNode(true);
    $(newClass).draggable(); // 
    newClass.style.position = "absolute";
    var diagramQuery = $("#diagram");
    var diagram = diagramQuery.get(0);
    newClass.style.top = (Math.random() * (diagram.offsetWidth - 200)) + "px";
    newClass.style.left = (Math.random() * (diagram.offsetHeight - 100)) + "px";
    
    $(newClass).children("tj-name").text("Klasse" + (diagramQuery.children().size() + 1));
    
    diagram.appendChild(newClass);
}

tidej.Editor.prototype.addProperty = function() {
	this.saveClass();
	$('#class-dialog').dialog('close');
    var newProperty = $("#templates tj-property").get(0).cloneNode(true);
    this.openPropertyDialog(newProperty);
}

tidej.Editor.prototype.addMethod = function() {
	this.saveClass();
	$('#class-dialog').dialog('close');
    var newMethod = $("#templates tj-method").get(0).cloneNode(true);
    this.openMethodDialog(newMethod);
}

tidej.Editor.prototype.addParam = function(after, name, type) {
	var row = "<tr class='horizontal method-dialog-param'>" +
	"<th>Par.:" +
	"<td><input value='" + (name||'') + "'></input></td>" +
	"<td><input value='" + (type||'') + "'></input></td>" +
	"<td><button onclick='tidej.editor.addParam(this)'>+</button>" + 
	"<button onclick='tidej.editor.removeParam(this)'>\u2212</button></td>" +
	"</tr>";
	$(after).closest('tr').after(row);
}

tidej.Editor.prototype.load = function() {
	window.console.log('load triggered...');
	this.stop();
	if (tidej.runtime.params()['id'] != null) {
		$("#diagram").text("Loading...")
		load(function(meta, content) {
			tidej.editor.initDiagram(meta, content);
		});
	}
}

tidej.Editor.prototype.removeParam = function(button) {
	$(button).closest('tr').remove();
}


tidej.Editor.prototype.openClassDialog = function(classElement) {
    this.currentClass = classElement;
    var q = $(classElement);
    $("#class-dialog-name").val(q.children("tj-name").text());
    $("#class-dialog-doc").val(q.children("tj-doc").text());
    $("#class-dialog-application").prop('checked', q.hasClass("application"));
    $("#class-dialog").dialog('open');
}

tidej.Editor.prototype.openPropertyDialog = function(propertyElement) {
    this.currentProperty = propertyElement;
    var q = $(propertyElement);
    $("#property-dialog-name").val(q.children("tj-name").text());
    $("#property-dialog-type").val(q.children("tj-type").text());
    $("#property-dialog-value").val(q.children("tj-value").text());
    $("#property-dialog-doc").val(q.children("tj-doc").text());
    var modifier = q.hasClass("const") ? "Konstante" : q.hasClass("static") ? "Klasseneigenschaft" : "Eigenschaft";
    $("#property-dialog-modifier").val(modifier); 
    $("#property-dialog").dialog('open');
}

tidej.Editor.prototype.openMethodDialog = function(methodElement) {
    this.currentMethod = methodElement;
    var q = $(methodElement);
    $("#method-dialog-name").val(q.children("tj-name").text());
    var type = q.children("tj-type").text();
    $("#method-dialog-type").val(type);
    $("#method-dialog-doc").val(q.children("tj-doc").text());
    		
    this.codeMirror.setValue(q.children("tj-body").text());

    var modifier;
    if (q.hasClass("constructor")) {
    	modifier = "Konstructor";
    } else if (type) {
    	modifier = q.hasClass("static") ? "Klassenanfrage" : "Anfrage";
    } else {
    	modifier = q.hasClass("static") ? "Klassenauftrag" : "Auftrag";
    }
    $("#property-dialog-modifier").val(modifier); 

    $(".method-dialog-param").remove();
    var insertAfter = $('#method-dialog-name').get(0);
    q.find("tj-param").each(function() {
        tidej.editor.addParam(insertAfter,
        		$(this).children("tj-name").text(),
        		$(this).children("tj-type").text());
    	insertAfter = $(".method-dialog-param").last().get(0);
    });
    $("#method-dialog").dialog('open');
}

tidej.Editor.prototype.saveClass = function() {
    var q = $(this.currentClass);
    q.children("tj-name").text($("#class-dialog-name").val());
    q.children("tj-doc").text($("#class-dialog-doc").val());
    if (this.currentClass.parentNode == null) {
        document.getElementById("diagram").appendChild(this.currentClass);
    }
    
    if ($("#class-dialog-application").is(':checked')) {
    	$("tj-class").removeClass("application");
        q.addClass("application");
    } else {
        q.removeClass("application");
    }

    tidej.runtime.loadClass(this.currentClass);
}

tidej.Editor.prototype.saveProperty = function() {
    var q = $(this.currentProperty);
    q.children("tj-name").text($("#property-dialog-name").val());
    q.children("tj-type").text($("#property-dialog-type").val());
    q.children("tj-value").text($("#property-dialog-value").val());
    q.children("tj-doc").text($("#property-dialog-doc").val());

    var modifier = $("#property-dialog-modifier").val();
    q.toggleClass("const", modifier == 'Konstante');
    q.toggleClass('static', modifier == 'Klasseneigenschaft');
    
    if (this.currentProperty.parentNode == null) {
        $(this.currentClass).children("tj-properties").get(0).appendChild(this.currentProperty);
    }
}

tidej.Editor.prototype.saveMethod = function() {
    var q = $(this.currentMethod);
    q.children('tj-name').text($('#method-dialog-name').val());
    q.children('tj-type').text($('#method-dialog-type').val());
    q.children('tj-body').text(this.codeMirror.getValue());
    q.children('tj-doc').text($('#method-dialog-doc').val());
    
    var modifier = $("#method-dialog-modifier").val();
    q.toggleClass("static", modifier == "Klassenauftrag" || modifier == "Klassenanfrage");
    q.toggleClass("constructor", modifier == "Constructor");
    
    var paramsQuery = q.find("tj-params");
    paramsQuery.empty();
    $(".method-dialog-param").each(function() {
    	var inputs = $(this).find("input").get();
    	console.log(inputs);
    	paramsQuery.append("<tj-param>" + 
    			"<tj-name>" + inputs[0].value + "</tj-name>" + 
    			"<tj-type>" + inputs[1].value + "</tj-type></tj-param>");
    });
    
    if (this.currentMethod.parentNode == null) {
        $(this.currentClass).children("tj-methods").get(0).appendChild(this.currentMethod);
    }
}

tidej.Editor.prototype.initUi = function() {
	this.codeMirror = CodeMirror.fromTextArea($('#method-dialog-body').get(0), {
	    lineNumbers: true});
	
	$("#diagram").bind("DOMSubtreeModified", function() {
		
		var title = $("#diagram tj-class.application>tj-name").text();
		if (title != null && title != '') {
			window.document.title = "Tidej - " + title;
		}
		
		if (tidej.editor.saveTimer != -1) {
			window.clearTimeout(tidej.editor.saveTimer);
		}
		tidej.editor.saveTimer = window.setTimeout(function() {
			tidej.editor.save();
		}, 4000);
	});
	
	$("#class-dialog").dialog({
		autoOpen: false,
		modal: true,
		width: 450,
		buttons: {
			'Abbrechen': function() {
				$(this).dialog("close");
			},
			'Loeschen': function(event) {
				var parent = tidej.editor.currentClass.parentNode;
				if (parent != null) {
					parent.removeChild(tidej.editor.currentClass);
				}
				$(this).dialog("close");
			},
			'Speichern': function() {
				tidej.editor.saveClass();
				$(this).dialog("close");
			}
		}
	});

	$("#property-dialog").dialog({
		autoOpen: false,
		modal: true,
		width: 450,
		buttons: {
			'Abbrechen': function() {
				$("#property-dialog").dialog('close');
			},
			'Loeschen': function(event) {
				var parent = tidej.editor.currentProperty.parentNode;
				if (parent != null) {
					parent.removeChild(tidej.editor.currentProperty);
				}
				$(this).dialog("close");
			},
			'Speichern': function() {
				tidej.editor.saveProperty();
				$("#property-dialog").dialog('close');
			}
		}
	});

	$("#method-dialog").dialog({
		autoOpen: false,
		modal: true,
		width: 800,
		height: 600,
		open: function() {
			tidej.editor.codeMirror.refresh();
		},
		buttons: {
			'Abbrechen': function() {
				$("#method-dialog").dialog('close');
			},
			'Loeschen': function(event) {
				var parent = tidej.editor.currentMethod.parentNode;
				if (parent != null) {
					parent.removeChild(tidej.editor.currentMethod);
				}
				$(this).dialog("close");
			},
			'Speichern': function() {
				tidej.editor.saveMethod();
				$("#method-dialog").dialog('close');
			}
		}
	});

	$("body").click(function (event) {
		var element = event.target;
		while (element != null) {
			var name = element.tagName;
			if (name != null) {
				if (element.id == 'class-dialog') {
					return;
				}
				name = name.toLowerCase();

				if (name == "tj-property") {
					tidej.editor.openPropertyDialog(element);
					return;
				} 
				if (name == "tj-method") {
					tidej.editor.openMethodDialog(element);
					return;
				} 
				if (name == "tj-class") {
					tidej.editor.openClassDialog(element);
					return;
				} 
				console.log(event.target.tagName);
			}
        
			element = element.parentNode;
		}
    
		
		// No element found.  
    
	});
    
 
};

tidej.Editor.prototype.initDiagram = function(content, meta) {
	$("#diagram").html(content);
	this.lastSaved = content;
	this.revision = meta['rev'];
	$("#revision").text(this.revision);
	$("tj-class").draggable();
};


tidej.Editor.prototype.save = function(callback) {
	var content = $("#diagram").html();
	console.log("save() called");
	if (content == this.lastSaved || $("#diagram tj-class").size() == 0) {
		console.log("content empty or unchanged!");
		if (callback != null) {
			callback();
		}
		return;
	}
	this.lastSaved = content;

	xmlhttp = new XMLHttpRequest();
	var path = "storage";
	var params = tidej.runtime.params();
	var id = params['id'];
	var secret = params['secret'];
	if (id != null && secret != null) {
		path += "?id=" + id + "&secret=" + secret;
	}
	xmlhttp.open("POST", path, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			var meta = tidej.runtime.parseParams(xmlhttp.responseText);
			var newId = meta['id'];
			this.revision = meta['rev'];
			window.console.log("id", id, "ret-meta:", meta);
			$("#revision").text(this.revision);
			if (id != newId) {
				history.pushState(null, null, "#id=" + newId + ";secret=" + meta['secret']);
			}
			if (callback != null) {
				callback();
			}
	  	}
	 }
	xmlhttp.send(content);
}

tidej.Editor.prototype.stop = function() {
	$('#stop-button').button('disable');
	$('#run').html('<div id="placeholder"></div>');
}

tidej.Editor.prototype.run = function(fullscreen) {
	if (fullscreen) {
		this.save(function() {
			var win = window.open('run.html#id=' + 
					tidej.runtime.params()['id'] + ';rev=' + tidej.editor.revision, 'run');
			win.focus();
		});
	} else {
		this.stop();
		this.save(function() {
			$('#stop-button').button('enable');
			$('#run').html('<iframe src="run.html"></iframe>');
			var iframeWindow = $("#run iframe").get(0).contentWindow;
			console.log("run", iframeWindow);
			iframeWindow.onload = function() {
				iframeWindow.update($("#diagram").html());
			}
		});
	}
}

tidej.editor = new tidej.Editor();

