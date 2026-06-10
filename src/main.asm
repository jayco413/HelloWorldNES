PPUCTRL   = $2000
PPUMASK   = $2001
PPUSTATUS = $2002
PPUSCROLL = $2005
PPUADDR   = $2006
PPUDATA   = $2007
JOYPAD1   = $4016
APU_FRAME = $4017
APU_STATUS = $4015
DMC_FREQ  = $4010
PULSE1_CTRL = $4000
PULSE1_SWEEP = $4001
PULSE1_TIMER_LO = $4002
PULSE1_TIMER_HI = $4003
PULSE2_CTRL = $4004
PULSE2_SWEEP = $4005
PULSE2_TIMER_LO = $4006
PULSE2_TIMER_HI = $4007
TRIANGLE_CTRL = $4008
TRIANGLE_TIMER_LO = $400A
TRIANGLE_TIMER_HI = $400B

COLOR_INDEX   = $00
JOY_CURRENT   = $01
JOY_PREVIOUS  = $02
JOY_NEW_PRESS = $03
COLOR_CHANGED = $04
UNDERLINE_WORD = $05
HELLO_ROW = $06
WORLD_ROW = $07
HELLO_COL = $08
WORLD_COL = $09
INPUT_LOCK = $0A
RETURN_STEP = $0B
TEMP_ROW = $0C
TEMP_COL = $0D
ADDR_LO = $0E
ADDR_HI = $0F
MUSIC_DELAY = $10
MUSIC_INDEX = $11

BUTTON_LEFT   = %00000001
BUTTON_RIGHT  = %00000010
BUTTON_SELECT = %00000100
BUTTON_UP     = %00001000
BUTTON_DOWN   = %00010000

RAINBOW_GREEN = $03
RAINBOW_VIOLET = $06
UNDERLINE_HELLO = $00
UNDERLINE_WORLD = $01
ORIGINAL_WORD_ROW = 14
FIRST_WORD_ROW = 1
LAST_WORD_ROW = 27
HELLO_BASE_COL = 10
WORLD_BASE_COL = 16
WORD_TILE_COUNT = 5
MUSIC_BASS_HOLD = $00
MUSIC_MELODY_REST = $01
PULSE_SOFT_CTRL = $72
PULSE_SILENT_CTRL = $70

TILE_SPACE = $00
TILE_H     = $01
TILE_E     = $02
TILE_L     = $03
TILE_O     = $04
TILE_W     = $05
TILE_R     = $06
TILE_D     = $07
TILE_UNDERLINE = $08

.ifndef CART_PRG_ONLY
.segment "HEADER"
    .byte "NES", $1A
    .byte $01        ; 16 KB PRG ROM
    .byte $01        ; 8 KB CHR ROM
    .byte $00        ; mapper 0, horizontal mirroring
    .byte $00
    .res 8, $00
.endif

.segment "CODE"

.proc nmi
    rti
.endproc

.proc irq
    rti
.endproc

.proc reset
    sei
    cld

    ldx #$40
    stx APU_FRAME
    ldx #$FF
    txs
    inx
    stx PPUCTRL
    stx PPUMASK
    stx DMC_FREQ
    stx APU_STATUS
    stx JOY_CURRENT
    stx JOY_PREVIOUS
    stx JOY_NEW_PRESS
    stx COLOR_CHANGED
    stx UNDERLINE_WORD
    stx INPUT_LOCK
    stx RETURN_STEP

    lda #RAINBOW_GREEN
    sta COLOR_INDEX
    lda #ORIGINAL_WORD_ROW
    sta HELLO_ROW
    sta WORLD_ROW
    lda #HELLO_BASE_COL
    sta HELLO_COL
    lda #WORLD_BASE_COL
    sta WORLD_COL
    jsr init_music

wait_vblank_1:
    bit PPUSTATUS
    bpl wait_vblank_1

wait_vblank_2:
    bit PPUSTATUS
    bpl wait_vblank_2

.ifdef CHR_RAM
    jsr load_chr_ram
.endif
    jsr load_palette
    jsr clear_nametable
    jsr draw_hello
    jsr draw_world
    jsr redraw_underlines

    lda #$00
    sta PPUSCROLL
    sta PPUSCROLL
    sta PPUCTRL
    lda #%00001000
    sta PPUMASK

forever:
    jsr wait_for_vblank
    jsr read_controller
    jsr update_new_presses

    lda INPUT_LOCK
    beq handle_input
    jsr advance_return_animation
    jmp frame_done

handle_input:
    jsr update_color_from_input
    jsr update_underline_from_input
    jsr update_vertical_from_input

    lda COLOR_CHANGED
    beq frame_done
    jsr write_text_color
    lda #$00
    sta COLOR_CHANGED

frame_done:
    jsr tick_music
    jmp forever
.endproc

.proc wait_for_vblank
wait_loop:
    bit PPUSTATUS
    bpl wait_loop
    rts
.endproc

.proc init_music
    lda #PULSE_SOFT_CTRL
    sta PULSE1_CTRL
    lda #PULSE_SILENT_CTRL
    sta PULSE2_CTRL
    lda #$00
    sta PULSE1_SWEEP
    sta PULSE2_SWEEP
    lda #$FF
    sta TRIANGLE_CTRL
    lda #$00
    sta MUSIC_INDEX
    sta MUSIC_DELAY
    lda #%00000111
    sta APU_STATUS
    jsr tick_music
    rts
.endproc

.proc tick_music
    lda MUSIC_DELAY
    beq play_note
    dec MUSIC_DELAY
    rts

play_note:
    ldx MUSIC_INDEX
    lda moonlight_pulse_lo, x
    sta PULSE1_TIMER_LO
    lda moonlight_pulse_hi, x
    sta PULSE1_TIMER_HI

    ldy moonlight_melody_hi, x
    beq melody_done
    cpy #MUSIC_MELODY_REST
    bne melody_note
    lda #PULSE_SILENT_CTRL
    sta PULSE2_CTRL
    jmp melody_done

melody_note:
    lda #PULSE_SOFT_CTRL
    sta PULSE2_CTRL
    lda moonlight_melody_lo, x
    sta PULSE2_TIMER_LO
    sty PULSE2_TIMER_HI

melody_done:
    ldy moonlight_bass_hi, x
    beq bass_done
    lda moonlight_bass_lo, x
    sta TRIANGLE_TIMER_LO
    sty TRIANGLE_TIMER_HI

bass_done:
    lda moonlight_delay, x
    sta MUSIC_DELAY
    inx
    cpx #moonlight_delay_end - moonlight_delay
    bne store_index
    ldx #$00

store_index:
    stx MUSIC_INDEX
    rts
.endproc

.proc load_palette
    bit PPUSTATUS
    lda #$3F
    sta PPUADDR
    lda #$00
    sta PPUADDR

    ldx #$00
palette_loop:
    lda palette, x
    sta PPUDATA
    inx
    cpx #palette_end - palette
    bne palette_loop
    rts
.endproc

.proc clear_nametable
    bit PPUSTATUS
    lda #$20
    sta PPUADDR
    lda #$00
    sta PPUADDR

    lda #TILE_SPACE
    ldy #$04
    ldx #$00
clear_loop:
    sta PPUDATA
    inx
    bne clear_loop
    dey
    bne clear_loop
    rts
.endproc

.ifdef CHR_RAM
.proc load_chr_ram
    bit PPUSTATUS
    lda #$00
    sta PPUADDR
    sta PPUADDR

    ldx #$00
chr_loop:
    lda chr_ram_tiles, x
    sta PPUDATA
    inx
    cpx #chr_ram_tiles_end - chr_ram_tiles
    bne chr_loop
    rts
.endproc
.endif

.proc restore_ppu_render_state
    lda #$00
    sta PPUCTRL
    sta PPUSCROLL
    sta PPUSCROLL
    rts
.endproc

.proc set_ppu_addr_from_temp
    ldx TEMP_ROW
    lda row_addr_hi, x
    sta ADDR_HI
    lda row_addr_lo, x
    clc
    adc TEMP_COL
    sta ADDR_LO
    bcc no_carry
    inc ADDR_HI

no_carry:
    bit PPUSTATUS
    lda ADDR_HI
    sta PPUADDR
    lda ADDR_LO
    sta PPUADDR
    rts
.endproc

.proc draw_hello
    lda HELLO_ROW
    sta TEMP_ROW
    lda HELLO_COL
    sta TEMP_COL
    jsr set_ppu_addr_from_temp

    ldx #$00
hello_loop:
    lda hello_word, x
    sta PPUDATA
    inx
    cpx #hello_word_end - hello_word
    bne hello_loop
    rts
.endproc

.proc draw_world
    lda WORLD_ROW
    sta TEMP_ROW
    lda WORLD_COL
    sta TEMP_COL
    jsr set_ppu_addr_from_temp

    ldx #$00
world_loop:
    lda world_word, x
    sta PPUDATA
    inx
    cpx #world_word_end - world_word
    bne world_loop
    rts
.endproc

.proc erase_hello
    lda HELLO_ROW
    sta TEMP_ROW
    lda HELLO_COL
    sta TEMP_COL
    jsr write_five_spaces
    rts
.endproc

.proc erase_world
    lda WORLD_ROW
    sta TEMP_ROW
    lda WORLD_COL
    sta TEMP_COL
    jsr write_five_spaces
    rts
.endproc

.proc erase_hello_underline
    lda HELLO_ROW
    clc
    adc #$01
    sta TEMP_ROW
    lda HELLO_COL
    sta TEMP_COL
    jsr write_five_spaces
    rts
.endproc

.proc erase_world_underline
    lda WORLD_ROW
    clc
    adc #$01
    sta TEMP_ROW
    lda WORLD_COL
    sta TEMP_COL
    jsr write_five_spaces
    rts
.endproc

.proc draw_hello_underline
    lda HELLO_ROW
    clc
    adc #$01
    sta TEMP_ROW
    lda HELLO_COL
    sta TEMP_COL
    jsr write_five_underlines
    rts
.endproc

.proc draw_world_underline
    lda WORLD_ROW
    clc
    adc #$01
    sta TEMP_ROW
    lda WORLD_COL
    sta TEMP_COL
    jsr write_five_underlines
    rts
.endproc

.proc write_five_spaces
    jsr set_ppu_addr_from_temp
    lda #TILE_SPACE
    ldx #WORD_TILE_COUNT
loop:
    sta PPUDATA
    dex
    bne loop
    rts
.endproc

.proc write_five_underlines
    jsr set_ppu_addr_from_temp
    lda #TILE_UNDERLINE
    ldx #WORD_TILE_COUNT
loop:
    sta PPUDATA
    dex
    bne loop
    rts
.endproc

.proc redraw_underlines
    jsr erase_hello_underline
    jsr erase_world_underline

    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne draw_world_line
    jsr draw_hello_underline
    jsr restore_ppu_render_state
    rts

draw_world_line:
    jsr draw_world_underline
    jsr restore_ppu_render_state
    rts
.endproc

.proc read_controller
    lda #$01
    sta JOYPAD1
    lda #$00
    sta JOYPAD1

    lda #$00
    sta JOY_CURRENT

    lda JOYPAD1 ; A
    lda JOYPAD1 ; B
    lda JOYPAD1 ; Select
    and #$01
    beq read_start
    lda JOY_CURRENT
    ora #BUTTON_SELECT
    sta JOY_CURRENT

read_start:
    lda JOYPAD1 ; Start

    lda JOYPAD1 ; Up
    and #$01
    beq read_down
    lda JOY_CURRENT
    ora #BUTTON_UP
    sta JOY_CURRENT

read_down:
    lda JOYPAD1 ; Down
    and #$01
    beq read_left
    lda JOY_CURRENT
    ora #BUTTON_DOWN
    sta JOY_CURRENT

read_left:
    lda JOYPAD1 ; Left
    and #$01
    beq check_right
    lda JOY_CURRENT
    ora #BUTTON_LEFT
    sta JOY_CURRENT

check_right:
    lda JOYPAD1 ; Right
    and #$01
    beq done
    lda JOY_CURRENT
    ora #BUTTON_RIGHT
    sta JOY_CURRENT

done:
    rts
.endproc

.proc update_new_presses
    lda JOY_PREVIOUS
    eor #$FF
    and JOY_CURRENT
    sta JOY_NEW_PRESS

    lda JOY_CURRENT
    sta JOY_PREVIOUS
    rts
.endproc

.proc update_color_from_input
    lda JOY_NEW_PRESS
    and #BUTTON_LEFT
    beq check_right
    jsr previous_color
    lda #$01
    sta COLOR_CHANGED
    rts

check_right:
    lda JOY_NEW_PRESS
    and #BUTTON_RIGHT
    beq done
    jsr next_color
    lda #$01
    sta COLOR_CHANGED

done:
    rts
.endproc

.proc update_underline_from_input
    lda JOY_NEW_PRESS
    and #BUTTON_SELECT
    beq done

    lda UNDERLINE_WORD
    eor #$01
    sta UNDERLINE_WORD
    jsr redraw_underlines

done:
    rts
.endproc

.proc update_vertical_from_input
    lda JOY_NEW_PRESS
    and #BUTTON_UP
    beq check_down
    jsr move_active_word_up
    rts

check_down:
    lda JOY_NEW_PRESS
    and #BUTTON_DOWN
    beq done
    jsr move_active_word_down

done:
    rts
.endproc

.proc get_active_row
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    lda HELLO_ROW
    rts

world:
    lda WORLD_ROW
    rts
.endproc

.proc decrement_active_row
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    dec HELLO_ROW
    rts

world:
    dec WORLD_ROW
    rts
.endproc

.proc increment_active_row
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    inc HELLO_ROW
    rts

world:
    inc WORLD_ROW
    rts
.endproc

.proc set_active_base_col
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    lda #HELLO_BASE_COL
    sta HELLO_COL
    rts

world:
    lda #WORLD_BASE_COL
    sta WORLD_COL
    rts
.endproc

.proc set_active_spiral_col
    ldx RETURN_STEP
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    lda #HELLO_BASE_COL
    clc
    adc hello_spiral_offsets, x
    sta HELLO_COL
    rts

world:
    lda #WORLD_BASE_COL
    clc
    adc world_spiral_offsets, x
    sta WORLD_COL
    rts
.endproc

.proc erase_active_word
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    jsr erase_hello
    jsr erase_hello_underline
    rts

world:
    jsr erase_world
    jsr erase_world_underline
    rts
.endproc

.proc draw_active_word
    lda UNDERLINE_WORD
    cmp #UNDERLINE_HELLO
    bne world
    jsr draw_hello
    jsr draw_hello_underline
    rts

world:
    jsr draw_world
    jsr draw_world_underline
    rts
.endproc

.proc begin_return_home
    lda #$01
    sta INPUT_LOCK
    lda #$00
    sta RETURN_STEP
    rts
.endproc

.proc move_active_word_up
    jsr get_active_row
    cmp #FIRST_WORD_ROW
    beq start_return
    bcc start_return
    jmp can_move

start_return:
    jsr begin_return_home
    rts

can_move:
    jsr erase_active_word
    jsr decrement_active_row
    jsr draw_active_word
    jsr restore_ppu_render_state
    rts
.endproc

.proc move_active_word_down
    jsr get_active_row
    cmp #LAST_WORD_ROW
    bne can_move
    jsr begin_return_home
    rts

can_move:
    jsr erase_active_word
    jsr increment_active_row
    jsr draw_active_word
    jsr restore_ppu_render_state
    rts
.endproc

.proc advance_return_animation
    jsr get_active_row
    cmp #ORIGINAL_WORD_ROW
    bne animate

    jsr erase_active_word
    jsr set_active_base_col
    lda #$00
    sta INPUT_LOCK
    sta RETURN_STEP
    jsr draw_active_word
    jsr restore_ppu_render_state
    rts

animate:
    jsr erase_active_word
    jsr get_active_row
    cmp #ORIGINAL_WORD_ROW
    bcc move_down
    jsr decrement_active_row
    jmp set_spiral

move_down:
    jsr increment_active_row

set_spiral:
    jsr set_active_spiral_col
    inc RETURN_STEP

    jsr get_active_row
    cmp #ORIGINAL_WORD_ROW
    bne draw
    jsr set_active_base_col
    lda #$00
    sta INPUT_LOCK
    sta RETURN_STEP

draw:
    jsr draw_active_word
    jsr restore_ppu_render_state
    rts
.endproc

.proc previous_color
    lda COLOR_INDEX
    beq wrap_to_violet
    sec
    sbc #$01
    sta COLOR_INDEX
    rts

wrap_to_violet:
    lda #RAINBOW_VIOLET
    sta COLOR_INDEX
    rts
.endproc

.proc next_color
    lda COLOR_INDEX
    cmp #RAINBOW_VIOLET
    beq wrap_to_red
    clc
    adc #$01
    sta COLOR_INDEX
    rts

wrap_to_red:
    lda #$00
    sta COLOR_INDEX
    rts
.endproc

.proc write_text_color
    bit PPUSTATUS
    lda #$3F
    sta PPUADDR
    lda #$01
    sta PPUADDR

    ldx COLOR_INDEX
    lda rainbow_palette, x
    sta PPUDATA

    jsr restore_ppu_render_state
    rts
.endproc

palette:
    .byte $0F, $2A, $0F, $0F
    .byte $0F, $2A, $0F, $0F
    .byte $0F, $2A, $0F, $0F
    .byte $0F, $2A, $0F, $0F
palette_end:

rainbow_palette:
    .byte $12 ; Red
    .byte $21 ; Orange
    .byte $2C ; Yellow
    .byte $2A ; Green
    .byte $27 ; Blue
    .byte $26 ; Indigo
    .byte $25 ; Violet

hello_word:
    .byte TILE_H, TILE_E, TILE_L, TILE_L, TILE_O
hello_word_end:

world_word:
    .byte TILE_W, TILE_O, TILE_R, TILE_L, TILE_D
world_word_end:

row_addr_hi:
    .byte $20, $20, $20, $20, $20, $20, $20, $20
    .byte $21, $21, $21, $21, $21, $21, $21, $21
    .byte $22, $22, $22, $22, $22, $22, $22, $22
    .byte $23, $23, $23, $23, $23, $23

row_addr_lo:
    .byte $00, $20, $40, $60, $80, $A0, $C0, $E0
    .byte $00, $20, $40, $60, $80, $A0, $C0, $E0
    .byte $00, $20, $40, $60, $80, $A0, $C0, $E0
    .byte $00, $20, $40, $60, $80, $A0

hello_spiral_offsets:
    .byte $FC, $FC, $FD, $FE, $FF, $00, $FF, $FE
    .byte $FF, $00, $00, $00, $00, $00

world_spiral_offsets:
    .byte $04, $04, $03, $02, $01, $00, $01, $02
    .byte $01, $00, $00, $00, $00, $00

moonlight_delay:
    .byte 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13
    .byte 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 19
    .byte 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 17
    .byte 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 27
moonlight_delay_end:

moonlight_pulse_lo:
    .byte $1A, $93, $52, $1A, $93, $52 ; G#3, C#4, E4 x2
    .byte $1A, $93, $52, $1A, $93, $52 ; G#3, C#4, E4 x2
    .byte $1A, $93, $52, $1A, $93, $52 ; G#3, C#4, E4 x2
    .byte $1A, $93, $52, $1A, $93, $52 ; G#3, C#4, E4 x2
    .byte $FB, $93, $52, $FB, $93, $52 ; A3, C#4, E4 x2
    .byte $FB, $7C, $2D, $FB, $7C, $2D ; A3, D4, F#4 x2
    .byte $1A, $C4, $52, $1A, $C4, $52 ; G#3, B3, E4 x2
    .byte $1A, $AB, $67, $1A, $AB, $67 ; G#3, C4, D#4 x2

moonlight_pulse_hi:
    .byte $FA, $F9, $F9, $FA, $F9, $F9 ; G#3, C#4, E4 x2
    .byte $FA, $F9, $F9, $FA, $F9, $F9 ; G#3, C#4, E4 x2
    .byte $FA, $F9, $F9, $FA, $F9, $F9 ; G#3, C#4, E4 x2
    .byte $FA, $F9, $F9, $FA, $F9, $F9 ; G#3, C#4, E4 x2
    .byte $F9, $F9, $F9, $F9, $F9, $F9 ; A3, C#4, E4 x2
    .byte $F9, $F9, $F9, $F9, $F9, $F9 ; A3, D4, F#4 x2
    .byte $FA, $F9, $F9, $FA, $F9, $F9 ; G#3, B3, E4 x2
    .byte $FA, $F9, $F9, $FA, $F9, $F9 ; G#3, C4, D#4 x2

moonlight_melody_lo:
    .byte $00, $00, $00, $00, $00, $00 ; rest
    .byte $00, $00, $00, $00, $00, $00 ; hold
    .byte $00, $00, $00, $00, $00, $00 ; hold
    .byte $00, $00, $00, $00, $00, $00 ; hold
    .byte $0C, $00, $00, $00, $00, $00 ; G#4
    .byte $FD, $00, $00, $00, $00, $00 ; A4
    .byte $E1, $00, $00, $00, $00, $00 ; B4
    .byte $C9, $00, $00, $E1, $00, $00 ; C#5, B4

moonlight_melody_hi:
    .byte $01, $00, $00, $00, $00, $00 ; rest
    .byte $00, $00, $00, $00, $00, $00 ; hold
    .byte $00, $00, $00, $00, $00, $00 ; hold
    .byte $00, $00, $00, $00, $00, $00 ; hold
    .byte $F9, $00, $00, $00, $00, $00 ; G#4
    .byte $F8, $00, $00, $00, $00, $00 ; A4
    .byte $F8, $00, $00, $00, $00, $00 ; B4
    .byte $F8, $00, $00, $F8, $00, $00 ; C#5, B4

moonlight_bass_lo:
    .byte $26, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 ; C#2
    .byte $89, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 ; B1
    .byte $F8, $00, $00, $00, $00, $00, $B8, $00, $00, $00, $00, $00 ; A1, F#1
    .byte $34, $00, $00, $00, $00, $00, $34, $00, $00, $00, $00, $00 ; G#1

moonlight_bass_hi:
    .byte $FB, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 ; C#2
    .byte $FB, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00, $00 ; B1
    .byte $FB, $00, $00, $00, $00, $00, $FC, $00, $00, $00, $00, $00 ; A1, F#1
    .byte $FC, $00, $00, $00, $00, $00, $FC, $00, $00, $00, $00, $00 ; G#1

.ifdef CHR_RAM
.macro chr_tile row0, row1, row2, row3, row4, row5, row6, row7
    .byte row0, row1, row2, row3, row4, row5, row6, row7
    .byte $00, $00, $00, $00, $00, $00, $00, $00
.endmacro

chr_ram_tiles:
    chr_tile $00, $00, $00, $00, $00, $00, $00, $00 ; space
    chr_tile $82, $82, $82, $FE, $82, $82, $82, $00 ; H
    chr_tile $00, $7C, $82, $FE, $80, $82, $7C, $00 ; e
    chr_tile $30, $10, $10, $10, $10, $10, $38, $00 ; l
    chr_tile $00, $7C, $82, $82, $82, $82, $7C, $00 ; o
    chr_tile $82, $82, $92, $92, $AA, $C6, $82, $00 ; W
    chr_tile $00, $BC, $C2, $80, $80, $80, $80, $00 ; r
    chr_tile $02, $02, $7E, $82, $82, $82, $7E, $00 ; d
    chr_tile $FF, $00, $00, $00, $00, $00, $00, $00 ; underline
chr_ram_tiles_end:
.endif

.segment "VECTORS"
    .word nmi
    .word reset
    .word irq

.ifndef CHR_RAM
.segment "CHARS"

.macro tile row0, row1, row2, row3, row4, row5, row6, row7
    .byte row0, row1, row2, row3, row4, row5, row6, row7
    .byte $00, $00, $00, $00, $00, $00, $00, $00
.endmacro

chr_start:
    tile $00, $00, $00, $00, $00, $00, $00, $00 ; space
    tile $82, $82, $82, $FE, $82, $82, $82, $00 ; H
    tile $00, $7C, $82, $FE, $80, $82, $7C, $00 ; e
    tile $30, $10, $10, $10, $10, $10, $38, $00 ; l
    tile $00, $7C, $82, $82, $82, $82, $7C, $00 ; o
    tile $82, $82, $92, $92, $AA, $C6, $82, $00 ; W
    tile $00, $BC, $C2, $80, $80, $80, $80, $00 ; r
    tile $02, $02, $7E, $82, $82, $82, $7E, $00 ; d
    tile $FF, $00, $00, $00, $00, $00, $00, $00 ; underline
    .res $2000 - (* - chr_start), $00
.endif
