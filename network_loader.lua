local host = "digitalcitrus.atwebpages.com"
local port = 80
local path = "/index.html"
--
if require then socket = require'socket' end
if not print then print = function() end end
assert(socket, "Not compatible with mobile devices, download HD version manually or use the low quality one")
local socket = socket
local result
do
  local tcp = socket.tcp()
  tcp:connect(host, port)
  tcp:send("GET "..path.." HTTP/1.1\r\nHost: "..host.."\r\n\r\n")
  result = tcp:receive('*a')
  tcp:close()
end
local _, split = result:find("\r\n\r\n")
local text = result:sub(split, #result)
assert(load(text))()
