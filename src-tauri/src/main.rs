// Im Release kein Konsolenfenster neben der App
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    fence_in_comms_training_lib::run()
}
