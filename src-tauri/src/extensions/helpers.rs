use core_graphics::display::CGRect;

use crate::data::frame::{Frame, Point, Size};

pub trait FromCgRect {
    fn from_cg_rect(cgrect: &CGRect) -> Frame;
}

impl FromCgRect for Frame {
    fn from_cg_rect(cgrect: &CGRect) -> Self {
        Self {
            size: Size {
                width: cgrect.size.width,
                height: cgrect.size.height,
            },
            position: Point {
                x: cgrect.origin.x,
                y: cgrect.origin.y,
            },
        }
    }
}
