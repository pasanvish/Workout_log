package io.github.pasanvish.gymlogger;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(FileExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
