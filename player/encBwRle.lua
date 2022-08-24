local cur = 3
local function D(i)
  return DATA:byte(i or cur, -1)
end
local 
  w,h, --Width, Height
  skp,cur,fcr, --Skip, Cursor, FramebufferCursor
  fb,c --Framebuffer, Color
= 
  D(),D(2),
  0,3,1,
  {} --c = nil

--Assumes 60 fps; 60/4 = 15 fps
function step()
  if skp == 0 then
    skp = 4 
    -- PARSE A SINGLE FRAME ----
    local o = 1
    while o do
      local d,x,y,T = D(),0,0
      if not d then return end
      cur = cur + 1
      c = not c
      for i=1,d do
        fb[fcr] = c
        fcr = fcr + 1
        if fcr > (w*h+1) then
          -- RENDER FRAME --
          for i=1,#fb do
            T = fb[i] and 255 or 0
            this:set_static_sprite_texel(x,y,T,T,T,255)
            x = x + 1
            if x >= w then
              y = y + 1
            end
          end
          ------------------
          fb = {}
          fcr = 1
          o = nil
        end
      end
    end
    ---------------------------
  end 
  skp = skp - 1
end
function init()
  this:init_draw(256, 128)
  this:add_static_sprite(0, 0, 0, 2, 1, 0, 0, w, h)
end
