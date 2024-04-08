use block::ConcreteBlock;
use cocoa::{
    base::{id, nil},
    foundation::NSString,
};
use objc::{class, msg_send, runtime::Class, sel, sel_impl};

pub struct NSNotificationCenter {
    observer: Option<id>, // NotificationCenter.default.removeObserver(self, name: NSApplication.didChangeScreenParametersNotification, object: nil)
    center_name: String,
}

impl NSNotificationCenter {
    pub fn new(name: String) -> Self {
        NSNotificationCenter {
            observer: None,
            center_name: name,
        }
    }

    pub fn listen<F>(mut self, name: String, callback: F) -> Self
    where
        F: Fn(id) -> () + Send + Sync + 'static,
    {
        let notification_name = unsafe { NSString::alloc(nil).init_str(name.as_str()) };
        let klass = Class::get(self.center_name.as_str()).unwrap();
        let ns_center: id = unsafe { msg_send![klass, defaultCenter] };
        let block = move |event: id| callback(event);
        let block = ConcreteBlock::new(block);
        let block = block.copy();

        let observer: id = unsafe {
            msg_send![ns_center,
                                               addObserverForName:notification_name
                                               object:nil
                                               queue:nil
                                               usingBlock:block]
        };
        self.observer = Some(observer);

        self
    }

    pub fn stop(&self) {
        if let Some(observer) = self.observer {
            let ns_center: id = unsafe { msg_send![class!(NSNotificationCenter), defaultCenter] };
            let _: id = unsafe { msg_send![ns_center, removeObserver:observer] };
        }
    }
}
