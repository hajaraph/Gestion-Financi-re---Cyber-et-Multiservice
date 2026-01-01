import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/multiservice_models.dart';
import '../../services/multiservice_service.dart';
import '../../widgets/modal_components.dart';

class PaliersRemiseModal extends StatefulWidget {
  final TarifService tarif;
  final VoidCallback onChanged;

  const PaliersRemiseModal({
    super.key,
    required this.tarif,
    required this.onChanged,
  });

  @override
  State<PaliersRemiseModal> createState() => _PaliersRemiseModalState();
}

class _PaliersRemiseModalState extends State<PaliersRemiseModal> {
  List<PalierRemise> _paliers = [];
  bool _isLoading = true;
  bool _submitting = false;

  final _seuilController = TextEditingController();
  final _prixController = TextEditingController();
  String _typeRemise = 'PRIX_UNITAIRE';

  @override
  void initState() {
    super.initState();
    _loadPaliers();
  }

  Future<void> _loadPaliers() async {
    final result = await multiserviceService.getPaliers(widget.tarif.id);
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.success) {
          _paliers = result.paliers;
        } else {
          showModernSnackBar(
            context,
            message: result.error ?? 'Erreur de chargement',
            type: SnackBarType.error,
          );
        }
      });
    }
  }

  Future<void> _addPalier() async {
    final seuilText = _seuilController.text.replaceAll(',', '.');
    final prixText = _prixController.text.replaceAll(',', '.');

    final seuilDouble = double.tryParse(seuilText);
    final seuil = seuilDouble?.toInt();
    final prix = double.tryParse(prixText);

    if (seuil == null || prix == null) {
      showModernSnackBar(
        context,
        message: 'Valeurs invalides',
        type: SnackBarType.error,
      );
      return;
    }

    setState(() => _submitting = true);

    final result = await multiserviceService.createPalier({
      'tarif_service': widget.tarif.id,
      'quantite_minimum': seuil,
      'valeur_remise': prix,
      'type_remise': _typeRemise,
    });

    if (mounted) {
      setState(() => _submitting = false);
      if (result.success) {
        _seuilController.clear();
        _prixController.clear();
        _loadPaliers();
        widget.onChanged();
      } else {
        showModernSnackBar(
          context,
          message: result.error ?? 'Erreur lors de l\'ajout',
          type: SnackBarType.error,
        );
      }
    }
  }

  Future<void> _deletePalier(int id) async {
    final success = await multiserviceService.deletePalier(id);
    if (mounted && success) {
      _loadPaliers();
      widget.onChanged();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Paliers : ${widget.tarif.nomService}',
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // List of paliers
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40.0),
                  child: CircularProgressIndicator(),
                ),
              )
            else ...[
              if (_paliers.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Column(
                      children: [
                        Icon(
                          Icons.percent,
                          size: 48,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Aucun palier configuré',
                          style: GoogleFonts.inter(
                            color: AppTheme.textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _paliers.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final p = _paliers[index];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade100),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.trending_down,
                              color: Colors.purple,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'À partir de ${p.qteSeuil} ${widget.tarif.uniteMesure ?? "unités"}',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  p.typeRemise == 'PRIX_UNITAIRE'
                                      ? 'Prix : ${p.valeurRemise.toStringAsFixed(0)} Ar'
                                      : (p.typeRemise == 'POURCENTAGE'
                                            ? 'Remise : ${p.valeurRemise.toStringAsFixed(0)}%'
                                            : 'Remise : -${p.valeurRemise.toStringAsFixed(0)} Ar'),
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.delete_outline,
                              color: AppTheme.error,
                            ),
                            onPressed: () => _deletePalier(p.id!),
                          ),
                        ],
                      ),
                    );
                  },
                ),

              const SizedBox(height: 32),

              // Form to add
              Text(
                'Ajouter un palier',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                key: ValueKey(_typeRemise),
                initialValue: _typeRemise,
                decoration: InputDecoration(
                  labelText: 'Type de remise',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'PRIX_UNITAIRE',
                    child: Text('Nouveau prix unitaire'),
                  ),
                  DropdownMenuItem(
                    value: 'POURCENTAGE',
                    child: Text('Pourcentage (%)'),
                  ),
                  DropdownMenuItem(
                    value: 'MONTANT_FIXE',
                    child: Text('Montant fixe (Ar)'),
                  ),
                ],
                onChanged: (v) => setState(() => _typeRemise = v!),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: ModernTextField(
                      controller: _seuilController,
                      label: 'Quantité seuil',
                      hint: '10',
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ModernTextField(
                      controller: _prixController,
                      label: _typeRemise == 'POURCENTAGE'
                          ? 'Pourcentage'
                          : (_typeRemise == 'MONTANT_FIXE'
                                ? 'Montant réduction'
                                : 'Nouveau prix'),
                      hint: _typeRemise == 'POURCENTAGE' ? '30' : '450',
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _submitting ? null : _addPalier,
                  icon: _submitting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.add),
                  label: const Text('AJOUTER CE PALIER'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ],
        ),
      ),
    );
  }
}
