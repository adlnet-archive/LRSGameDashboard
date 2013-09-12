// Connection properties.. used by TCDriver
var props = {
	endpoint:"http://localhost:8000/xapi/",
	auth:"Base64 " + Base64.encode('tom:1234'),
	actor:{ "mbox":"mailto:tom@example.com", "name":"tom creighton" },
};