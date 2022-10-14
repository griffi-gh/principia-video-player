local host = "digitalcitrus.atwebpages.com"
local port = 80
local path = "/index.html"
--
if require then
  socket = require'socket'
end
assert(socket, "Not compatible with mobile devices, download HD version manually or use the low quality one")
local socket = socket
local tcp = socket.tcp()
tcp:connect(host, port)
tcp:send("GET "..path.." HTTP/1.1\r\nHost: "..host.."\r\n\r\n")
local result = tcp:receive('*a')
tcp:close()
print(result:find("\r\n\r\n"))
