LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
LOCAL_MODULE := gymlogger_abi
LOCAL_SRC_FILES := compatible.c
include $(BUILD_SHARED_LIBRARY)
