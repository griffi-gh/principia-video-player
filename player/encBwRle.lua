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
  | d | num  | rle length   |
   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
     ___________
   _/ CONSTANTS \____________
  | F | num | 255           |
  | N | nil | nil           |
   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
     _______________
   _/ step() LOCALS \____________
  | B | bool | frame ready       |
  | T | any  | generic temporary |
   ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
]]

--c,B,T,w,h = nil
local F,p,x,y,S,d, c,B,T,w,h = 255,3,0,0,0,0
local function D(i)
  return DATA:byte(i or p)
end
w = D(1)
h = D(2)

function step()
  if S < 1 then
    --Reset delay counter
    S = 5
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

--x, y, rotation, width, height, texel_from_x, texel_from_y, texel_to_x, texel_to_y

function init()
  this:init_draw(256, 256)
  -- this:set_sprite_filtering(0)
  -- this:clear_texels(0)
  -- this:add_static_sprite(0, 0, 0, 4, 3, 0, 0, w, h)
  -- world:get_entity(this:get_id()):hide()
end
