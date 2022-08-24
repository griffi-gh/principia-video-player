local cur = 3
local function D(i)
  return DATA:byte(i or cur)
end
local 
  w,h,skp, --Width, height, Skip
  x,y,c-- x , y, color (nil)
= D(1),D(2),0,0,0

--Assumes 60 fps; 60/4 = 15 fps
function step()
  if skp <= 0 then
    skp = 4 
    -- PARSE A SINGLE FRAME ----
    for i=1,25 do
      local d,T,W = D(),c and 255 or 0
      cur = cur + 1
      c = not c
      if d ~= 0 then
        if d == 255 then
          while true do
            W = D()
            d = d + W
            cur = cur + 1
            if W ~= 255 then break end
          end
        end
        for i=1,d do
          this:set_sprite_texel(x,y,T,T,T,255)
          x = x + 1
          if x >= w then
            x = 0
            y = y + 1
            if y >= h then
              y = 0
            end
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
