--[[
  video data is stored in DATA (binary string)
     _________               
   _/ GLOBALS \_____________ 
  | p | num  | pointer      |
  | x | num  | scan x       |
  | y | num  | scan y       |
  | S | num  | skip (delay) |
  | w | num  | width        |
  | h | num  | height       |
  | c | bool | color        |
   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯ 
     ___________             
   _/ CONSTANTS \____________
  | F | num | 255           |
  | N | nil | nil           |
   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯ 
   ______________________________
  | B | bool | frame ready       |
  | d | num  | rle length        |
  | T | num  | generic temporary |
   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
]]

--c,B,d,T,w,h = nil
local F,p,x,y,S, c,B,d,T,w,h = 255,3,0,0,0
local function D(i)
  return DATA:byte(i or p)
end
w = D(1)
h = D(2)
assert(D() == 0)

function step()
  if S <= 0 then
    --Reset delay counter
    S = 5
    --Keep running until the frame is ready
    B = N
    while not B do
      --Keep reading $FF until we encounter something else
      d = 0
      repeat
        T = D()
        d = d + T
        p = p + 1
      until T ~= F
      -- Flip color
      c = not c
      --Render
      for i=1,d do
        --Plot pixel
        T = c and F or 0
        this:set_sprite_texel(x,h-y,T,T,T,F)
        --Increment scan pos
        x = x + 1
        if x >= w then
          x = 0
          y = y + 1
          if y >= h then
            y = 0
            B = 1 -- Frame ready
          end
        end
      end
    end
  end
  -- Decrement counter
  S = S - 1
  --Drae sprite
  this:draw_sprite(0, 0, 0, 2, 1, 0, 0, w, h)
end

function init()
  this:init_draw(256, 256)
end
