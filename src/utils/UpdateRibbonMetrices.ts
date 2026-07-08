import type { Workbook } from "../core/Workbook.js";
import type { SelectionState } from "../events/InteractionHandler.js";
import { RangeSelectionManage } from "./RangeSelectionManage.js";

// show the calculation at bottom tab
export function updateRibbonMetrics(selection: SelectionState | null,workbook: Workbook): void 
{
    const domRibbonMetrics = document.getElementById("ribbonMetrics");
    const domStatCount = document.getElementById("statCount");
    const domStatSum = document.getElementById("statSum");
    const domStatAvg = document.getElementById("statAvg");
    const domStatMin = document.getElementById("statMin");
    const domStatMax = document.getElementById("statMax");
    if (!selection || selection.startRowIdx === undefined || selection.endRowIdx === undefined || selection.startColIdx === undefined || selection.endColIdx === undefined) 
    {
        if (domRibbonMetrics) 
            domRibbonMetrics.style.display = "none";

        return;
    }

    if (domRibbonMetrics)
        domRibbonMetrics.style.display = "flex";

    const bounds = RangeSelectionManage.normalizeSelection(selection);

    const metrics = workbook.calculateMetricsForRange(bounds.minR, bounds.maxR, bounds.minC, bounds.maxC);

    if (domStatCount) 
        domStatCount.textContent = `Count: ${metrics.count}`;

    const numericVisibility = metrics.hasNumeric ? "inline" : "none";
    
    if (domStatSum) 
    {
        domStatSum.style.display = numericVisibility;
        domStatSum.textContent = `Sum: ${metrics.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    if (domStatAvg) 
    {
        domStatAvg.style.display = numericVisibility;
        domStatAvg.textContent = `Avg: ${metrics.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    if (domStatMin) 
    {
        domStatMin.style.display = numericVisibility;
        domStatMin.textContent = `Min: ${metrics.min}`;
    }
    
    if (domStatMax) 
    {
        domStatMax.style.display = numericVisibility;
        domStatMax.textContent = `Max: ${metrics.max}`;
    }
}
