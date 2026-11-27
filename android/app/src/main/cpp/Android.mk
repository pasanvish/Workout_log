LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
LOCAL_MODULE := gymlogger_abi
LOCAL_SRC_FILES := compatible.c
LOCAL_LDFLAGS += -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384
include $(BUILD_SHARED_LIBRARY)
