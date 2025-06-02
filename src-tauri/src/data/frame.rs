use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Frame {
    pub size: Size,
    pub position: Point,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

impl Default for Frame {
    fn default() -> Self {
        Frame {
            size: Size::default(),
            position: Point::default(),
        }
    }
}

impl Default for Point {
    fn default() -> Self {
        Point { x: 0.0, y: 0.0 }
    }
}

impl Default for Size {
    fn default() -> Self {
        Size {
            width: 0.0,
            height: 0.0,
        }
    }
}
