// This file was renamed to orderUtils.js to fix MIME type issues on static hosting.

export const calculateOrderProgress = (order, workflow) => {
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
        // If an order is finalized but the workflow is gone, show 100%
        if (order.is_finalized) return 100;
        return 0;
    }

    const totalSteps = workflow.steps.length;
    let completedSteps = 0;

    workflow.steps.forEach(step => {
        if (order.steps_data?.[step.id]?.completed_at) {
            completedSteps++;
        }
    });

    // An order can be marked as finalized manually, so it should be considered 100% complete.
    if (order.is_finalized) return 100;

    return Math.round((completedSteps / totalSteps) * 100);
};
