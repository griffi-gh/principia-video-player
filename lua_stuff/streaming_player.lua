--Modified version of encBwRle player
--Reads data from network
if not socket then game:message("Not compatible with Android") end
local socket = assert(socket, "\n\nThis version is not compatible with mobile devices!\nTry the low-quality version: https://principia-web.se/level/544\rOr download the level file manually: https://drive.google.com/file/d/1GwndVUdROCCYTp48YWljY446Tkht3RUL/view?usp=sharing")

--Config
local host = "digitalcitrus.atwebpages.com"
local port = 80
local path = "/OMEGA/video.bin"
local chunkSize = 64

--init
local ready = false
function init()
  this:init_draw(1024, 1024)
  this:set_sprite_filtering(0)
  game:prompt("Select video quality", "High (320x240@30fps)", "Medium (255x193@15fps)", "Low (130x98@15fps)")
end

local F,p,x,y,S,d,c,B,T,w,h = 255,3,0,0,0,0
local D = function() error('not ready yet') end
local high_framerate = false

function on_response(response, r_id)
  if response == 3 then
    path = path..'.very-lq'
  elseif response == 2 then
    path = path..'.lq'
  elseif response == 1 then
    high_framerate = true
  end
  game:message("Playing video "..path.." at "..(high_framerate and 30 or 15).." FPS")

  --net
  local tcp = socket.tcp()
  tcp:connect(host, port)
  tcp:send("GET "..path.." HTTP/1.1\r\nHost: "..host.."\r\n\r\n")
  local str = ''
  repeat
    str = str..tcp:receive(1)
  until str:find('\r\n\r\n')
  local buffer = {}
  local buffer_ptr = 1
  local function fetch()
    if buffer_ptr > #buffer then
      buffer_ptr = 1
      local chunk = tcp:receive(chunkSize)
      for i=1,chunkSize do
        buffer[i] = chunk:byte(i)
      end
    end
    buffer_ptr = buffer_ptr + 1
    return buffer[buffer_ptr - 1]
  end
  --
  D = function(i)
    return fetch()
  end
  w = D()
  h = D()
  if (w == 72) and (h == 81) then --If starts with "HQ"
    w = D()
    w = w + (D() * 256)
    h = D()
    h = h + (D() * 256)
  end
  ready = true
end

function step()
  if not ready then return end
  if S < 1 then
    --Reset delay counter
    S = high_framerate and 2 or 5
    --Keep running until the frame is ready
    B = N
    repeat
      if d < 1 then
        --Keep reading $FF until we encounter something else
        repeat
          T = D()
          d = d + T
          p = p + 1
        until T ~= F
        --Flip color
        c = not c
      end
      --Render
      while d > 0 do
        --Decrement d
        d = d - 1
        
        --Plot pixel
        T = c and F or 0
        this:set_sprite_texel(x,h-y-1,T,T,T,F)
        
        --Increment scan pos
        x = x + 1
        if x >= w then
          x = 0
          y = y + 1
          if y >= h then
            y = 0
            B = 1 -- Frame ready
            break
          end
        end
      end
    until B
  end
  -- Decrement delay counter
  S = S - 1
  -- Draw sprite
  this:draw_sprite(0, 0, 0, 4, 3, 0, 0, w, h)
end


