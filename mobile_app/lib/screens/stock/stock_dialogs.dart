import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/stock_models.dart';
import '../../services/stock_service.dart';
import '../../widgets/modal_components.dart';

class StockEntryDialog extends StatefulWidget {
  final StockItem stock;
  final VoidCallback onSuccess;

  const StockEntryDialog({
    super.key,
    required this.stock,
    required this.onSuccess,
  });

  @override
  State<StockEntryDialog> createState() => _StockEntryDialogState();
}

class _StockEntryDialogState extends State<StockEntryDialog> {
  final _formKey = GlobalKey<FormState>();
  final _qtyController = TextEditingController();
  final _priceController = TextEditingController();
  final _supplierController = TextEditingController();
  final _invoiceController = TextEditingController();
  final _commentController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _qtyController.dispose();
    _priceController.dispose();
    _supplierController.dispose();
    _invoiceController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final qty = double.tryParse(_qtyController.text) ?? 0;
    final price = double.tryParse(_priceController.text) ?? 0;

    final result = await stockService.recordEntry(
      produitId: widget.stock.produitId,
      quantiteAchat: qty,
      prixTotalAchat: price,
      fournisseur: _supplierController.text,
      numeroFacture: _invoiceController.text,
      commentaire: _commentController.text,
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (result.success) {
        Navigator.pop(context, true); // Pop Entry modal with success result
        showModernSnackBar(
          context,
          message: 'Entrée enregistrée avec succès',
          type: SnackBarType.success,
        );
        widget.onSuccess();
      } else {
        showModernSnackBar(
          context,
          message: result.error ?? 'Erreur inconnue',
          type: SnackBarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Nouvelle Entrée',
      showBackButton: true,
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text('ENREGISTRER'),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.stock.nomProduit,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 24),

              // Info units
              Container(
                padding: const EdgeInsets.all(12),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Achat en ${widget.stock.uniteAchatSymbole ?? "unités"}. Le stock sera incrémenté en ${widget.stock.uniteMesureProduit ?? "unités"}.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (widget.stock.uniteAchatSymbole != null &&
                        widget.stock.quantiteParUniteAchat > 1) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Conversion : 1 ${widget.stock.uniteAchatSymbole} = ${widget.stock.quantiteParUniteAchat.toStringAsFixed(0)} ${widget.stock.uniteMesureProduit}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppTheme.primaryBlue.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              ModernTextField(
                controller: _qtyController,
                label: 'Quantité Achetée',
                hint: 'Ex: 10',
                keyboardType: TextInputType.number,
                validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
              ),
              const SizedBox(height: 16),
              ModernTextField(
                controller: _priceController,
                label: 'Prix Total Achat (Ar)',
                hint: 'Ex: 50000',
                keyboardType: TextInputType.number,
                validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
              ),
              const SizedBox(height: 16),
              ModernTextField(
                controller: _supplierController,
                label: 'Fournisseur (Optionnel)',
                hint: 'Nom du fournisseur',
              ),
              const SizedBox(height: 16),
              ModernTextField(
                controller: _invoiceController,
                label: 'N° Facture (Optionnel)',
                hint: 'Numéro de facture',
              ),
              const SizedBox(height: 16),
              ModernTextField(
                controller: _commentController,
                label: 'Commentaire (Optionnel)',
                hint: 'Notes...',
                maxLines: 2,
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}

class StockAdjustmentDialog extends StatefulWidget {
  final StockItem stock;
  final VoidCallback onSuccess;

  const StockAdjustmentDialog({
    super.key,
    required this.stock,
    required this.onSuccess,
  });

  @override
  State<StockAdjustmentDialog> createState() => _StockAdjustmentDialogState();
}

class _StockAdjustmentDialogState extends State<StockAdjustmentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _qtyController = TextEditingController();
  final _commentController = TextEditingController();
  String _type = 'AUGMENTATION';
  bool _submitting = false;

  @override
  void dispose() {
    _qtyController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final qty = double.tryParse(_qtyController.text) ?? 0;

    final result = await stockService.adjustStock(
      stockId: widget.stock.id,
      quantite: qty,
      typeAjustement: _type,
      commentaire: _commentController.text,
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (result.success) {
        Navigator.pop(
          context,
          true,
        ); // Pop Adjustment modal with success result
        showModernSnackBar(
          context,
          message: 'Ajustement enregistré avec succès',
          type: SnackBarType.success,
        );
        widget.onSuccess();
      } else {
        showModernSnackBar(
          context,
          message: result.error ?? 'Erreur inconnue',
          type: SnackBarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Ajustement de Stock',
      showBackButton: true,
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text('AJUSTER'),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.stock.nomProduit,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 24),

              ModernDropdown<String>(
                label: "Type d'ajustement",
                value: _type,
                items: const [
                  DropdownMenuItem(
                    value: 'AUGMENTATION',
                    child: Text('Augmentation (+)'),
                  ),
                  DropdownMenuItem(
                    value: 'DIMINUTION',
                    child: Text('Diminution (-)'),
                  ),
                ],
                onChanged: (v) => setState(() => _type = v!),
                hint: "Choisir le type",
              ),
              const SizedBox(height: 16),

              ModernTextField(
                controller: _qtyController,
                label: 'Quantité',
                hint: '0',
                keyboardType: TextInputType.number,
                validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
              ),
              const SizedBox(height: 16),

              ModernTextField(
                controller: _commentController,
                label: 'Raison / Commentaire',
                hint: 'Raison de l\'ajustement',
                maxLines: 3,
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}

class StockRevaluationDialog extends StatefulWidget {
  final StockItem stock;
  final VoidCallback onSuccess;

  const StockRevaluationDialog({
    super.key,
    required this.stock,
    required this.onSuccess,
  });

  @override
  State<StockRevaluationDialog> createState() => _StockRevaluationDialogState();
}

class _StockRevaluationDialogState extends State<StockRevaluationDialog> {
  final _formKey = GlobalKey<FormState>();
  final _priceController = TextEditingController();
  final _commentController = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.stock.prixAchatMoyen != null) {
      _priceController.text = (widget.stock.prixAchatMoyen!).toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _priceController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final price = double.tryParse(_priceController.text) ?? 0;

    final result = await stockService.revalueStockPrice(
      stockId: widget.stock.id,
      nouveauPrix: price,
      commentaire: _commentController.text,
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (result.success) {
        Navigator.pop(
          context,
          true,
        ); // Pop Revaluation modal with success result
        showModernSnackBar(
          context,
          message: 'Prix moyen mis à jour avec succès',
          type: SnackBarType.success,
        );
        widget.onSuccess();
      } else {
        showModernSnackBar(
          context,
          message: result.error ?? 'Erreur inconnue',
          type: SnackBarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Réévaluation du Prix',
      showBackButton: true,
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text('RÉÉVALUER'),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.stock.nomProduit,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 24),

              Container(
                padding: const EdgeInsets.all(12),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Attention : Cette action modifie la valeur du stock actuel.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.orange[800],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              ModernTextField(
                controller: _priceController,
                label: 'Nouveau Prix Moyen (Ar)',
                hint: '0',
                keyboardType: TextInputType.number,
                validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
              ),
              const SizedBox(height: 16),

              ModernTextField(
                controller: _commentController,
                label: 'Raison / Commentaire',
                hint: 'Pourquoi ce changement ?',
                maxLines: 2,
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
