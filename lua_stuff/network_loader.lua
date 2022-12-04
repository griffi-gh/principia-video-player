--Assertions
local socket = assert(socket, "\n\nThis version is not compatible with mobile devices!\nTry the low-quality version: https://principia-web.se/level/544\rOr download the level file manually: https://drive.google.com/file/d/1GwndVUdROCCYTp48YWljY446Tkht3RUL/view?usp=sharing")

--Configuration
local host = "digitalcitrus.atwebpages.com"
local port = 80
local path = "/player.lua"

--Request
function init()
  local tcp = socket.tcp()
  tcp:connect(host, port)
  tcp:send("GET "..path.." HTTP/1.1\r\nHost: "..host.."\r\n\r\n")
  local data = tcp:receive('*a')
  tcp:close()
  local _, split = data:find("\r\n\r\n")
  local text = data:sub(split, #data)
  assert(load(text))()
end

