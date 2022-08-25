local function dec(data)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    data = string.gsub(data, '[^'..b..'=]', '')
    return (data:gsub('.', function(x)
        if (x == '=') then return '' end
        local r,f='',(b:find(x)-1)
        for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and '1' or '0') end
        return r;
    end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)
        if (#x ~= 8) then return '' end
        local c=0
        for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end
        return string.char(c)
    end))
end

local cur = 3
local function D(i)
  return DATA:byte(i or cur)
end
local 
  w,h,skp, --Width, height, Skip
  x,y,c-- x , y, color (nil)
= 0,0,0,0,0

--first, dexompress base64
local g, z = 1, ""
function step()
  z = z .. dec(DATA:sub(g,2400-1+g))
  g = g + 2400
  if g > #DATA then
    step = step1
    DATA = z
    w = D(1)
    h = D(2)
  end
  game:show_numfeed((g / #DATA) * 100)
end

--Assumes 60 fps; 60/4 = 15 fps
function step1()
  if skp <= 0 then
    skp = 5
    -- PARSE A SINGLE FRAME ----
    local B
    while not B do
      local d,T,W = D()
      cur = cur + 1
      c = not c
      if d == 255 then
        while true do
          W = D()
          d = d + W
          cur = cur + 1
          if W ~= 255 then break end
        end
      end
      for i=1,d do
        T = c and 255 or 0
        this:set_sprite_texel(x,h-y,T,T,T,255)
        x = x + 1
        if x >= w then
          x = 0
          y = y + 1
          if y >= h then
            y = 0
            B = true
          end
        end
      end
    end
    ---------------------------
  end 
  skp = skp - 1
  this:draw_sprite(0, 0, 0, 2, 1, 0, 0, w, h)
end
function init()
  this:init_draw(256, 128)
end
